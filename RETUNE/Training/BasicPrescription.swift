import Foundation

struct AttemptSnapshot: Equatable, Sendable {
    let timestamp: Date
    let exerciseType: ExerciseType
    let referenceMidi: Int
    let intervalSemitones: Int?
    let direction: IntervalDirection?
    let intervalErrorCents: Double?
    let stability: Double
}

enum BasicPrescription {
    static func next(from history: [AttemptSnapshot]) -> [ExerciseDefinition] {
        guard let latest = history.sorted(by: { $0.timestamp > $1.timestamp }).first else {
            return starterPlan()
        }

        if let interval = interval(from: latest.intervalSemitones),
           let direction = latest.direction,
           let error = latest.intervalErrorCents,
           abs(error) >= 35 {
            let root = latest.referenceMidi
            return [
                .intervalImitation(referenceMidi: root, interval: interval, direction: direction),
                .referenceOnlyInterval(referenceMidi: root, interval: interval, direction: direction),
                .referenceOnlyInterval(referenceMidi: transposedRoot(from: root), interval: interval, direction: direction)
            ]
        }

        if latest.stability < 0.70 {
            let root = latest.referenceMidi
            return [
                .sameNote(referenceMidi: root, promptLevel: 1),
                .sameNote(referenceMidi: transposedRoot(from: root), promptLevel: 1),
                .referenceOnlyInterval(referenceMidi: root, interval: .majorSecond, direction: .ascending)
            ]
        }

        return starterPlan(root: transposedRoot(from: latest.referenceMidi))
    }

    private static func starterPlan(root: Int = 60) -> [ExerciseDefinition] {
        [
            .sameNote(referenceMidi: root, promptLevel: 1),
            .intervalImitation(referenceMidi: root, interval: .majorSecond, direction: .ascending),
            .referenceOnlyInterval(referenceMidi: root, interval: .majorSecond, direction: .ascending)
        ]
    }

    private static func interval(from semitones: Int?) -> MusicalInterval? {
        guard let semitones else { return nil }
        return MusicalInterval(rawValue: semitones)
    }

    private static func transposedRoot(from midi: Int) -> Int {
        let shifted = midi + 2
        return shifted <= 72 ? shifted : midi - 2
    }
}
