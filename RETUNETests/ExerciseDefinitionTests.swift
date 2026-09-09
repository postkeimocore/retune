import XCTest
@testable import RETUNE

final class ExerciseDefinitionTests: XCTestCase {
    func testSameNoteTargetsReference() {
        let exercise = ExerciseDefinition.sameNote(referenceMidi: 60, promptLevel: 1)
        XCTAssertEqual(exercise.referenceMidi, 60)
        XCTAssertEqual(exercise.targetMidi, 60)
        XCTAssertEqual(exercise.type, .sameNoteRecall)
    }

    func testAscendingMajorThird() {
        let exercise = ExerciseDefinition.referenceOnlyInterval(
            referenceMidi: 60,
            interval: .majorThird,
            direction: .ascending
        )
        XCTAssertEqual(exercise.targetMidi, 64)
        XCTAssertEqual(exercise.expectedIntervalCents, 400, accuracy: 0.001)
    }

    func testDescendingMajorSecond() {
        let exercise = ExerciseDefinition.referenceOnlyInterval(
            referenceMidi: 60,
            interval: .majorSecond,
            direction: .descending
        )
        XCTAssertEqual(exercise.targetMidi, 58)
        XCTAssertEqual(exercise.expectedIntervalCents, -200, accuracy: 0.001)
    }

    func testPhaseSequence() {
        XCTAssertEqual(ExercisePhase.prepare.next, .referencePlaying)
        XCTAssertEqual(ExercisePhase.referencePlaying.next, .recallSilence)
        XCTAssertEqual(ExercisePhase.recallSilence.next, .recording)
        XCTAssertEqual(ExercisePhase.recording.next, .evaluating)
        XCTAssertEqual(ExercisePhase.evaluating.next, .result)
        XCTAssertNil(ExercisePhase.result.next)
    }
}
