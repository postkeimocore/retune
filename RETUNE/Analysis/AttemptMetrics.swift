import Foundation

struct AttemptMetrics: Equatable, Sendable {
    let initialErrorCents: Double
    let settlingTimeMs: Double?
    let medianErrorCents: Double
    let stability: Double
    let driftCentsPerSecond: Double
    let directLanding: Bool
}
