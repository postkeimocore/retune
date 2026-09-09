import Foundation

enum MusicalInterval: Int, CaseIterable, Codable, Sendable {
    case minorSecond = 1
    case majorSecond = 2
    case minorThird = 3
    case majorThird = 4
    case perfectFourth = 5
    case perfectFifth = 7

    var semitones: Int { rawValue }
    var expectedCents: Double { Double(rawValue) * 100.0 }
}
