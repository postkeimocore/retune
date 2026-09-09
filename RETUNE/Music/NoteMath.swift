import Foundation

enum NoteMath {
    static func frequency(midi: Int, a4: Double = 440.0) -> Double {
        a4 * pow(2.0, Double(midi - 69) / 12.0)
    }

    static func midi(frequency: Double, a4: Double = 440.0) -> Double {
        69.0 + 12.0 * log2(frequency / a4)
    }

    static func cents(detectedHz: Double, targetHz: Double) -> Double {
        1200.0 * log2(detectedHz / targetHz)
    }

    static func frequency(midiOffset: Int, from referenceHz: Double) -> Double {
        referenceHz * pow(2.0, Double(midiOffset) / 12.0)
    }

    static func noteName(midi: Int) -> String {
        let names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        let normalized = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        return "\(names[normalized])\(octave)"
    }
}
