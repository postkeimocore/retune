import XCTest
@testable import RETUNE

final class AutocorrelationPitchDetectorTests: XCTestCase {
    private func sine(
        frequency: Double,
        sampleRate: Double = 44_100,
        count: Int = 4096
    ) -> [Float] {
        (0..<count).map { i in
            Float(sin(2.0 * Double.pi * frequency * Double(i) / sampleRate))
        }
    }

    func testDetectsRepresentativeVocalFrequencies() {
        let detector = AutocorrelationPitchDetector(
            minFrequency: 80,
            maxFrequency: 1000,
            minimumConfidence: 0.6
        )

        for target in [220.0, 261.6256, 329.6276, 440.0] {
            guard let result = detector.detect(
                samples: sine(frequency: target),
                sampleRate: 44_100
            ) else {
                return XCTFail("No result for \(target) Hz")
            }
            let cents = NoteMath.cents(detectedHz: result.frequencyHz, targetHz: target)
            XCTAssertLessThanOrEqual(abs(cents), 8.0)
            XCTAssertGreaterThanOrEqual(result.confidence, 0.6)
        }
    }

    func testSilenceReturnsNil() {
        let detector = AutocorrelationPitchDetector()
        XCTAssertNil(detector.detect(
            samples: Array(repeating: 0, count: 4096),
            sampleRate: 44_100
        ))
    }
}
