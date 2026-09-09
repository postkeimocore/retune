import Foundation

struct AttemptDebugSnapshot: Equatable, Sendable {
    let acceptedFrameCount: Int
    let firstAcceptedFrameMs: Double?
    let medianDetectedHz: Double?
    let meanConfidence: Double?
    let meanRMS: Double?

    init(frames: [PitchFrame]) {
        acceptedFrameCount = frames.count

        guard !frames.isEmpty else {
            firstAcceptedFrameMs = nil
            medianDetectedHz = nil
            meanConfidence = nil
            meanRMS = nil
            return
        }

        firstAcceptedFrameMs = frames.first.map { $0.timestamp * 1000 }

        let sortedFrequencies = frames.map(\.frequencyHz).sorted()
        let middle = sortedFrequencies.count / 2
        if sortedFrequencies.count.isMultiple(of: 2) {
            medianDetectedHz = (sortedFrequencies[middle - 1] + sortedFrequencies[middle]) / 2
        } else {
            medianDetectedHz = sortedFrequencies[middle]
        }

        meanConfidence = frames.map(\.confidence).reduce(0, +) / Double(frames.count)
        meanRMS = frames.map(\.rms).reduce(0, +) / Double(frames.count)
    }
}
