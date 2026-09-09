import Foundation

struct PitchFrame: Equatable, Sendable {
    let timestamp: Double
    let frequencyHz: Double
    let confidence: Double
    let rms: Double
}
