import Foundation

struct AttemptAnalyzer {
    let onsetExclusionSeconds: Double
    let minimumConfidence: Double
    let minimumRMS: Double
    let landingToleranceCents: Double

    init(
        onsetExclusionSeconds: Double = 0.2,
        minimumConfidence: Double = 0.8,
        minimumRMS: Double = 0.02,
        landingToleranceCents: Double = 35.0
    ) {
        self.onsetExclusionSeconds = onsetExclusionSeconds
        self.minimumConfidence = minimumConfidence
        self.minimumRMS = minimumRMS
        self.landingToleranceCents = landingToleranceCents
    }

    static func intervalError(
        referenceHz: Double,
        targetInterval: MusicalInterval,
        producedHz: Double
    ) -> Double {
        NoteMath.cents(detectedHz: producedHz, targetHz: referenceHz) - targetInterval.expectedCents
    }

    func analyze(
        frames: [PitchFrame],
        targetHz: Double,
        toleranceCents: Double
    ) -> AttemptMetrics? {
        let reliable = frames
            .filter { $0.confidence >= minimumConfidence && $0.rms >= minimumRMS && $0.frequencyHz > 0 }
            .sorted { $0.timestamp < $1.timestamp }

        guard let firstReliable = reliable.first else { return nil }
        let scoringStart = firstReliable.timestamp + onsetExclusionSeconds
        let eligible = reliable.filter { $0.timestamp >= scoringStart }
        guard !eligible.isEmpty else { return nil }

        let errors = eligible.map { NoteMath.cents(detectedHz: $0.frequencyHz, targetHz: targetHz) }
        let initial = errors[0]
        let median = Self.median(errors)
        let inTuneCount = errors.filter { abs($0) <= toleranceCents }.count
        let stability = Double(inTuneCount) / Double(errors.count)
        let drift = Self.linearSlope(times: eligible.map(\.timestamp), values: errors)
        let directLanding = abs(initial) <= landingToleranceCents

        var settlingTimeMs: Double?
        for (index, error) in errors.enumerated() where abs(error) <= toleranceCents {
            settlingTimeMs = max(0, (eligible[index].timestamp - firstReliable.timestamp) * 1000.0)
            break
        }

        return AttemptMetrics(
            initialErrorCents: initial,
            settlingTimeMs: settlingTimeMs,
            medianErrorCents: median,
            stability: stability,
            driftCentsPerSecond: drift,
            directLanding: directLanding
        )
    }

    private static func median(_ values: [Double]) -> Double {
        let sorted = values.sorted()
        let middle = sorted.count / 2
        if sorted.count.isMultiple(of: 2) {
            return (sorted[middle - 1] + sorted[middle]) / 2.0
        }
        return sorted[middle]
    }

    private static func linearSlope(times: [Double], values: [Double]) -> Double {
        guard times.count == values.count, times.count >= 2 else { return 0 }
        let meanT = times.reduce(0, +) / Double(times.count)
        let meanV = values.reduce(0, +) / Double(values.count)
        var numerator = 0.0
        var denominator = 0.0
        for (t, v) in zip(times, values) {
            let dt = t - meanT
            numerator += dt * (v - meanV)
            denominator += dt * dt
        }
        guard denominator > 0 else { return 0 }
        return numerator / denominator
    }
}
