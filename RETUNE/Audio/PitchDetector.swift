import Foundation

struct PitchDetectionResult: Equatable, Sendable {
    let frequencyHz: Double
    let confidence: Double
}

protocol PitchDetector {
    func detect(samples: [Float], sampleRate: Double) -> PitchDetectionResult?
}
