import Foundation

enum ExerciseType: String, Codable, Sendable {
    case sameNoteRecall
    case intervalImitation
    case referenceOnlyInterval
}

enum IntervalDirection: Int, Codable, Sendable {
    case ascending = 1
    case descending = -1
}

struct ExerciseDefinition: Equatable, Sendable {
    let type: ExerciseType
    let referenceMidi: Int
    let targetMidi: Int
    let interval: MusicalInterval?
    let direction: IntervalDirection?
    let promptLevel: Int
    let silenceDelaySeconds: Double
    let recordDurationSeconds: Double

    var referenceHz: Double { NoteMath.frequency(midi: referenceMidi) }
    var targetHz: Double { NoteMath.frequency(midi: targetMidi) }
    var expectedIntervalCents: Double {
        guard let interval, let direction else { return 0 }
        return Double(direction.rawValue) * interval.expectedCents
    }

    static func sameNote(
        referenceMidi: Int,
        promptLevel: Int = 1,
        silenceDelaySeconds: Double = 1.5,
        recordDurationSeconds: Double = 2.0
    ) -> ExerciseDefinition {
        ExerciseDefinition(
            type: .sameNoteRecall,
            referenceMidi: referenceMidi,
            targetMidi: referenceMidi,
            interval: nil,
            direction: nil,
            promptLevel: promptLevel,
            silenceDelaySeconds: silenceDelaySeconds,
            recordDurationSeconds: recordDurationSeconds
        )
    }

    static func referenceOnlyInterval(
        referenceMidi: Int,
        interval: MusicalInterval,
        direction: IntervalDirection,
        silenceDelaySeconds: Double = 1.5,
        recordDurationSeconds: Double = 2.0
    ) -> ExerciseDefinition {
        ExerciseDefinition(
            type: .referenceOnlyInterval,
            referenceMidi: referenceMidi,
            targetMidi: referenceMidi + interval.semitones * direction.rawValue,
            interval: interval,
            direction: direction,
            promptLevel: 2,
            silenceDelaySeconds: silenceDelaySeconds,
            recordDurationSeconds: recordDurationSeconds
        )
    }

    static func intervalImitation(
        referenceMidi: Int,
        interval: MusicalInterval,
        direction: IntervalDirection,
        silenceDelaySeconds: Double = 1.0,
        recordDurationSeconds: Double = 2.0
    ) -> ExerciseDefinition {
        ExerciseDefinition(
            type: .intervalImitation,
            referenceMidi: referenceMidi,
            targetMidi: referenceMidi + interval.semitones * direction.rawValue,
            interval: interval,
            direction: direction,
            promptLevel: 0,
            silenceDelaySeconds: silenceDelaySeconds,
            recordDurationSeconds: recordDurationSeconds
        )
    }
}
