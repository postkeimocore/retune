import AVFoundation

final class MicrophoneCapture {
    private let engine = AVAudioEngine()
    private var isCapturing = false

    func start(onBuffer: @escaping @Sendable ([Float], Double) -> Void) throws {
        guard !isCapturing else { return }
        try AudioSessionController.shared.configure()

        let input = engine.inputNode
        let format = input.inputFormat(forBus: 0)
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 2048, format: format) { buffer, _ in
            guard let channel = buffer.floatChannelData?[0] else { return }
            let count = Int(buffer.frameLength)
            let samples = Array(UnsafeBufferPointer(start: channel, count: count))
            onBuffer(samples, format.sampleRate)
        }

        engine.prepare()
        try engine.start()
        isCapturing = true
    }

    func stop() {
        guard isCapturing else { return }
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        isCapturing = false
    }
}
