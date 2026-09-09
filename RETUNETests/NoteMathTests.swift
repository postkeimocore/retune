import XCTest
@testable import RETUNE

final class NoteMathTests: XCTestCase {
    func testA4Is440Hz() {
        XCTAssertEqual(NoteMath.frequency(midi: 69), 440, accuracy: 0.0001)
    }

    func testMiddleC() {
        XCTAssertEqual(NoteMath.frequency(midi: 60), 261.6256, accuracy: 0.001)
    }

    func testCentsOneSemitoneUp() {
        let upper = NoteMath.frequency(midi: 70)
        XCTAssertEqual(NoteMath.cents(detectedHz: upper, targetHz: 440), 100, accuracy: 0.01)
    }

    func testMajorThirdIs400Cents() {
        XCTAssertEqual(MusicalInterval.majorThird.expectedCents, 400)
    }

    func testPerfectFifthIs700Cents() {
        XCTAssertEqual(MusicalInterval.perfectFifth.expectedCents, 700)
    }
}
