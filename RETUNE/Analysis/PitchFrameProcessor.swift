import Foundation

struct PitchFrameProcessor: Sendable {
    var detector: any PitchDetector
    var minimumRMS: Double
    var minimumConfidence: Double

    init(
        detector: any PitchDetector = AutocorrelationPitchDetector(),
        minimumRMS: Double = 0.02,
        minimumConfidence: Double = 0.8
    ) {
        self.detector = detector
        self.minimumRMS = minimumRMS
        self.minimumConfidence = minimumConfidence
    }

    func process(
        samples: [Float],
        sampleRate: Double,
        timestamp: Double
    ) -> PitchFrame? {
        guard !samples.isEmpty else { return nil }
        let rms = sqrt(samples.reduce(0.0) { partial, sample in
            partial + Double(sample * sample)
        } / Double(samples.count))
        guard rms >= minimumRMS else { return nil }
        guard let detected = detector.detect(samples: samples, sampleRate: sampleRate) else { return nil }
        guard detected.confidence >= minimumConfidence else { return nil }

        return PitchFrame(
            timestamp: timestamp,
            frequencyHz: detected.frequencyHz,
            confidence: detected.confidence,
            rms: rms
        )
    }
}
