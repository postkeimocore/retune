import AVFoundation

final class AudioSessionController {
    static let shared = AudioSessionController()

    private init() {}

    func configure() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .measurement,
            options: [.defaultToSpeaker, .allowBluetooth]
        )
        try session.setPreferredSampleRate(44_100)
        try session.setPreferredIOBufferDuration(0.01)
        try session.setActive(true)
    }
}
