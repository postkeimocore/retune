import Foundation
import SwiftUI

@MainActor
final class ExerciseSessionController: ObservableObject {
    @Published private(set) var phase: ExercisePhase = .prepare
    @Published private(set) var result: ExerciseResult?
    @Published private(set) var errorMessage: String?
    @Published private(set) var currentExercise: ExerciseDefinition?

    private let referencePlayer: ReferenceTonePlayer
    private let microphoneCapture: MicrophoneCapture
    private let frameProcessor: PitchFrameProcessor
    private let analyzer: AttemptAnalyzer

    private var frames: [PitchFrame] = []
    private var task: Task<Void, Never>?

    init(
        referencePlayer: ReferenceTonePlayer = ReferenceTonePlayer(),
        microphoneCapture: MicrophoneCapture = MicrophoneCapture(),
        frameProcessor: PitchFrameProcessor = PitchFrameProcessor(),
        analyzer: AttemptAnalyzer = AttemptAnalyzer()
    ) {
        self.referencePlayer = referencePlayer
        self.microphoneCapture = microphoneCapture
        self.frameProcessor = frameProcessor
        self.analyzer = analyzer
    }

    deinit {
        task?.cancel()
    }

    func start(_ exercise: ExerciseDefinition) {
        cancel()
        currentExercise = exercise
        result = nil
        errorMessage = nil
        phase = .prepare
        task = Task { [weak self] in
            await self?.run(exercise)
        }
    }

    func retry() {
        guard let currentExercise else { return }
        start(currentExercise)
    }

    func cancel() {
        task?.cancel()
        task = nil
        microphoneCapture.stop()
        referencePlayer.stop()
        frames.removeAll(keepingCapacity: false)
        if phase != .result {
            phase = .prepare
        }
    }

    private func run(_ exercise: ExerciseDefinition) async {
        do {
            try AudioSessionController.shared.configure()
            frames.removeAll(keepingCapacity: true)

            phase = .referencePlaying
            try await playPrompt(for: exercise)
            try Task.checkCancellation()

            phase = .recallSilence
            try await sleep(seconds: exercise.silenceDelaySeconds)
            try Task.checkCancellation()

            phase = .recording
            let startTime = ProcessInfo.processInfo.systemUptime
            let processor = frameProcessor
            try microphoneCapture.start { [weak self] samples, sampleRate in
                let timestamp = ProcessInfo.processInfo.systemUptime - startTime
                guard let frame = processor.process(
                    samples: samples,
                    sampleRate: sampleRate,
                    timestamp: timestamp
                ) else { return }
                Task { @MainActor [weak self] in
                    self?.frames.append(frame)
                }
            }

            try await sleep(seconds: exercise.recordDurationSeconds)
            microphoneCapture.stop()
            try Task.checkCancellation()

            phase = .evaluating
            guard let metrics = analyzer.analyze(
                frames: frames,
                targetHz: exercise.targetHz,
                toleranceCents: 35
            ) else {
                errorMessage = "音程を十分に判定できませんでした。もう一度、短く『ねー』と歌ってみてください。"
                phase = .result
                return
            }

            let intervalValues = intervalMetrics(for: exercise, metrics: metrics)
            result = ExerciseResult(
                definition: exercise,
                metrics: metrics,
                actualIntervalCents: intervalValues.actual,
                intervalErrorCents: intervalValues.error,
                debugSnapshot: AttemptDebugSnapshot(frames: frames)
            )
            phase = .result
        } catch is CancellationError {
            microphoneCapture.stop()
        } catch {
            microphoneCapture.stop()
            errorMessage = error.localizedDescription
            phase = .result
        }
    }

    private func playPrompt(for exercise: ExerciseDefinition) async throws {
        switch exercise.type {
        case .intervalImitation:
            try await referencePlayer.play(frequencyHz: exercise.referenceHz, duration: 0.65)
            try await sleep(seconds: 0.18)
            try await referencePlayer.play(frequencyHz: exercise.targetHz, duration: 0.65)
        case .sameNoteRecall, .referenceOnlyInterval:
            try await referencePlayer.play(frequencyHz: exercise.referenceHz, duration: 0.75)
        }
        referencePlayer.stop()
    }

    private func intervalMetrics(
        for exercise: ExerciseDefinition,
        metrics: AttemptMetrics
    ) -> (actual: Double?, error: Double?) {
        guard exercise.interval != nil else { return (nil, nil) }
        let producedHz = exercise.targetHz * pow(2.0, metrics.medianErrorCents / 1200.0)
        let actual = NoteMath.cents(detectedHz: producedHz, targetHz: exercise.referenceHz)
        return (actual, actual - exercise.expectedIntervalCents)
    }

    private func sleep(seconds: Double) async throws {
        guard seconds > 0 else { return }
        try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    }
}
