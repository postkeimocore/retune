import Foundation

enum ExercisePhase: Equatable, Sendable {
    case prepare
    case referencePlaying
    case recallSilence
    case recording
    case evaluating
    case result

    var next: ExercisePhase? {
        switch self {
        case .prepare: return .referencePlaying
        case .referencePlaying: return .recallSilence
        case .recallSilence: return .recording
        case .recording: return .evaluating
        case .evaluating: return .result
        case .result: return nil
        }
    }
}
