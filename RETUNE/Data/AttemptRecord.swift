import Foundation
import SwiftData

@Model
final class AttemptRecord {
    @Attribute(.unique) var id: UUID
    var timestamp: Date
    var exerciseTypeRaw: String
    var referenceMidi: Int
    var targetMidi: Int
    var intervalSemitones: Int?
    var directionRaw: Int?
    var promptLevel: Int
    var initialErrorCents: Double
    var settlingTimeMs: Double?
    var medianErrorCents: Double
    var stability: Double
    var driftCentsPerSecond: Double
    var intervalErrorCents: Double?
    var directLanding: Bool

    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        exerciseTypeRaw: String,
        referenceMidi: Int,
        targetMidi: Int,
        intervalSemitones: Int?,
        directionRaw: Int?,
        promptLevel: Int,
        initialErrorCents: Double,
        settlingTimeMs: Double?,
        medianErrorCents: Double,
        stability: Double,
        driftCentsPerSecond: Double,
        intervalErrorCents: Double?,
        directLanding: Bool
    ) {
        self.id = id
        self.timestamp = timestamp
        self.exerciseTypeRaw = exerciseTypeRaw
        self.referenceMidi = referenceMidi
        self.targetMidi = targetMidi
        self.intervalSemitones = intervalSemitones
        self.directionRaw = directionRaw
        self.promptLevel = promptLevel
        self.initialErrorCents = initialErrorCents
        self.settlingTimeMs = settlingTimeMs
        self.medianErrorCents = medianErrorCents
        self.stability = stability
        self.driftCentsPerSecond = driftCentsPerSecond
        self.intervalErrorCents = intervalErrorCents
        self.directLanding = directLanding
    }

    convenience init(result: ExerciseResult, timestamp: Date = Date()) {
        self.init(
            timestamp: timestamp,
            exerciseTypeRaw: result.definition.type.rawValue,
            referenceMidi: result.definition.referenceMidi,
            targetMidi: result.definition.targetMidi,
            intervalSemitones: result.definition.interval?.semitones,
            directionRaw: result.definition.direction?.rawValue,
            promptLevel: result.definition.promptLevel,
            initialErrorCents: result.metrics.initialErrorCents,
            settlingTimeMs: result.metrics.settlingTimeMs,
            medianErrorCents: result.metrics.medianErrorCents,
            stability: result.metrics.stability,
            driftCentsPerSecond: result.metrics.driftCentsPerSecond,
            intervalErrorCents: result.intervalErrorCents,
            directLanding: result.metrics.directLanding
        )
    }

    var snapshot: AttemptSnapshot {
        AttemptSnapshot(
            timestamp: timestamp,
            exerciseType: ExerciseType(rawValue: exerciseTypeRaw) ?? .sameNoteRecall,
            referenceMidi: referenceMidi,
            intervalSemitones: intervalSemitones,
            direction: directionRaw.flatMap(IntervalDirection.init(rawValue:)),
            intervalErrorCents: intervalErrorCents,
            stability: stability
        )
    }
}
