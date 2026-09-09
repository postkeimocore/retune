import XCTest
@testable import RETUNE

final class AttemptAnalyzerTests: XCTestCase {
    func testMajorThirdProduced58CentsWide() {
        let reference = 261.625565
        let produced = reference * pow(2.0, 458.0 / 1200.0)
        let error = AttemptAnalyzer.intervalError(
            referenceHz: reference,
            targetInterval: .majorThird,
            producedHz: produced
        )
        XCTAssertEqual(error, 58, accuracy: 0.5)
    }

    func testDirectLandingMedianAndStability() {
        let target = 440.0
        let frames = [
            PitchFrame(timestamp: 0.00, frequencyHz: target, confidence: 0.95, rms: 0.1),
            PitchFrame(timestamp: 0.10, frequencyHz: target, confidence: 0.95, rms: 0.1),
            PitchFrame(timestamp: 0.21, frequencyHz: target * pow(2.0, 10.0 / 1200.0), confidence: 0.95, rms: 0.1),
            PitchFrame(timestamp: 0.31, frequencyHz: target * pow(2.0, 20.0 / 1200.0), confidence: 0.95, rms: 0.1),
            PitchFrame(timestamp: 0.41, frequencyHz: target * pow(2.0, 50.0 / 1200.0), confidence: 0.95, rms: 0.1),
            PitchFrame(timestamp: 0.51, frequencyHz: target * pow(2.0, 20.0 / 1200.0), confidence: 0.95, rms: 0.1)
        ]
        let analyzer = AttemptAnalyzer()
        let metrics = analyzer.analyze(frames: frames, targetHz: target, toleranceCents: 35)

        XCTAssertNotNil(metrics)
        XCTAssertEqual(metrics?.directLanding, true)
        XCTAssertEqual(metrics?.medianErrorCents ?? 0, 20, accuracy: 0.1)
        XCTAssertEqual(metrics?.stability ?? 0, 0.75, accuracy: 0.0001)
    }

    func testLowConfidenceAttemptDoesNotScore() {
        let analyzer = AttemptAnalyzer()
        let metrics = analyzer.analyze(
            frames: [PitchFrame(timestamp: 0, frequencyHz: 440, confidence: 0.2, rms: 0.1)],
            targetHz: 440,
            toleranceCents: 35
        )
        XCTAssertNil(metrics)
    }
}
