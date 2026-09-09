import Foundation

struct ExerciseResult: Equatable, Sendable {
    let definition: ExerciseDefinition
    let metrics: AttemptMetrics
    let actualIntervalCents: Double?
    let intervalErrorCents: Double?

    var primaryValueText: String {
        if let intervalErrorCents {
            return String(format: "%+.0f¢", intervalErrorCents)
        }
        return String(format: "%+.0f¢", metrics.medianErrorCents)
    }

    var observation: String {
        if let intervalErrorCents {
            if abs(intervalErrorCents) <= 20 {
                return "ほぼ中央です"
            }
            let relation = intervalErrorCents > 0 ? "広く" : "狭く"
            return "音程の幅を少し\(relation)取りました"
        }

        if abs(metrics.medianErrorCents) <= 20 {
            return "ほぼ中央です"
        }
        return metrics.medianErrorCents > 0 ? "少し高めです" : "少し低めです"
    }
}
