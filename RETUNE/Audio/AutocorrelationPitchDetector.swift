import Foundation

struct AutocorrelationPitchDetector: PitchDetector {
    let minFrequency: Double
    let maxFrequency: Double
    let minimumConfidence: Double
    let minimumRMS: Double

    init(
        minFrequency: Double = 80,
        maxFrequency: Double = 1000,
        minimumConfidence: Double = 0.6,
        minimumRMS: Double = 0.005
    ) {
        self.minFrequency = minFrequency
        self.maxFrequency = maxFrequency
        self.minimumConfidence = minimumConfidence
        self.minimumRMS = minimumRMS
    }

    func detect(samples: [Float], sampleRate: Double) -> PitchDetectionResult? {
        guard samples.count >= 256, sampleRate > 0 else { return nil }
        let mean = samples.reduce(0.0) { $0 + Double($1) } / Double(samples.count)
        let centered = samples.map { Double($0) - mean }
        let rms = sqrt(centered.reduce(0.0) { $0 + $1 * $1 } / Double(centered.count))
        guard rms >= minimumRMS else { return nil }

        let minLag = max(2, Int(floor(sampleRate / maxFrequency)))
        let maxLag = min(samples.count / 2, Int(ceil(sampleRate / minFrequency)))
        guard maxLag > minLag + 2 else { return nil }

        var correlations = Array(repeating: 0.0, count: maxLag + 1)
        for lag in minLag...maxLag {
            var cross = 0.0
            var energyA = 0.0
            var energyB = 0.0
            let limit = centered.count - lag
            if limit <= 0 { continue }
            for i in 0..<limit {
                let a = centered[i]
                let b = centered[i + lag]
                cross += a * b
                energyA += a * a
                energyB += b * b
            }
            let denominator = sqrt(energyA * energyB)
            correlations[lag] = denominator > 0 ? cross / denominator : 0
        }

        var bestLag: Int?
        var bestCorrelation = -1.0
        for lag in (minLag + 1)..<maxLag {
            let c = correlations[lag]
            if c >= minimumConfidence && c >= correlations[lag - 1] && c > correlations[lag + 1] {
                bestLag = lag
                bestCorrelation = c
                break
            }
        }

        if bestLag == nil {
            for lag in minLag...maxLag where correlations[lag] > bestCorrelation {
                bestCorrelation = correlations[lag]
                bestLag = lag
            }
        }

        guard let lag = bestLag, bestCorrelation >= minimumConfidence else { return nil }

        var refinedLag = Double(lag)
        if lag > minLag && lag < maxLag {
            let y1 = correlations[lag - 1]
            let y2 = correlations[lag]
            let y3 = correlations[lag + 1]
            let denominator = y1 - 2.0 * y2 + y3
            if abs(denominator) > 1e-12 {
                let offset = 0.5 * (y1 - y3) / denominator
                if abs(offset) <= 1.0 { refinedLag += offset }
            }
        }

        guard refinedLag > 0 else { return nil }
        return PitchDetectionResult(
            frequencyHz: sampleRate / refinedLag,
            confidence: max(0, min(1, bestCorrelation))
        )
    }
}
