import XCTest
@testable import RETUNE

final class AttemptDebugSnapshotTests: XCTestCase {
    func testBuildsSummaryFromAcceptedPitchFrames() {
        let frames = [
            PitchFrame(timestamp: 0.12, frequencyHz: 438.0, confidence: 0.90, rms: 0.10),
            PitchFrame(timestamp: 0.20, frequencyHz: 440.0, confidence: 0.95, rms: 0.20),
            PitchFrame(timestamp: 0.28, frequencyHz: 442.0, confidence: 0.85, rms: 0.30)
        ]

        let snapshot = AttemptDebugSnapshot(frames: frames)

        XCTAssertEqual(snapshot.acceptedFrameCount, 3)
        XCTAssertEqual(snapshot.firstAcceptedFrameMs, 120, accuracy: 0.001)
        XCTAssertEqual(snapshot.medianDetectedHz, 440, accuracy: 0.001)
        XCTAssertEqual(snapshot.meanConfidence, 0.90, accuracy: 0.001)
        XCTAssertEqual(snapshot.meanRMS, 0.20, accuracy: 0.001)
    }

    func testEmptyFramesProduceZeroSafeValues() {
        let snapshot = AttemptDebugSnapshot(frames: [])

        XCTAssertEqual(snapshot.acceptedFrameCount, 0)
        XCTAssertNil(snapshot.firstAcceptedFrameMs)
        XCTAssertNil(snapshot.medianDetectedHz)
        XCTAssertNil(snapshot.meanConfidence)
        XCTAssertNil(snapshot.meanRMS)
    }
}
