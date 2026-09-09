import Foundation

struct PitchDetectionResult: Equatable, Sendable {
    let frequencyHz: Double
    let confidence: Double
}

protocol PitchDetector: Sendable {
    func detect(samples: [Float], sampleRate: Double) -> PitchDetectionResult?
}
