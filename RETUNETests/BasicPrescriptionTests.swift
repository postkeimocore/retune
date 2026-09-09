import XCTest
@testable import RETUNE

final class BasicPrescriptionTests: XCTestCase {
    func testNewUserGetsCalibrationModelAndGeneration() {
        let plan = BasicPrescription.next(from: [])
        XCTAssertEqual(plan.count, 3)
        XCTAssertEqual(plan[0].type, .sameNoteRecall)
        XCTAssertEqual(plan[1].type, .intervalImitation)
        XCTAssertEqual(plan[2].type, .referenceOnlyInterval)
    }

    func testLargeMajorThirdErrorRepeatsSameSkillThenTransposes() {
        let weakM3 = AttemptSnapshot(
            timestamp: Date(),
            exerciseType: .referenceOnlyInterval,
            referenceMidi: 60,
            intervalSemitones: 4,
            direction: .ascending,
            intervalErrorCents: 62,
            stability: 0.88
        )

        let plan = BasicPrescription.next(from: [weakM3])
        XCTAssertEqual(plan.count, 3)
        XCTAssertEqual(plan[0].interval, .majorThird)
        XCTAssertEqual(plan[1].type, .referenceOnlyInterval)
        XCTAssertNotEqual(plan[2].referenceMidi, plan[1].referenceMidi)
    }

    func testPoorStabilityReturnsToSameNoteWork() {
        let unstable = AttemptSnapshot(
            timestamp: Date(),
            exerciseType: .sameNoteRecall,
            referenceMidi: 60,
            intervalSemitones: nil,
            direction: nil,
            intervalErrorCents: nil,
            stability: 0.55
        )
        let plan = BasicPrescription.next(from: [unstable])
        XCTAssertEqual(plan[0].type, .sameNoteRecall)
    }
}
