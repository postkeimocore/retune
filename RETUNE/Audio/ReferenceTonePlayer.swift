import AVFoundation

final class ReferenceTonePlayer {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let sampleRate: Double = 44_100

    init() {
        engine.attach(player)
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        engine.connect(player, to: engine.mainMixerNode, format: format)
    }

    func play(frequencyHz: Double, duration: TimeInterval) async throws {
        guard frequencyHz > 0, duration > 0 else { return }
        try AudioSessionController.shared.configure()
        if !engine.isRunning {
            try engine.start()
        }

        let frameCount = AVAudioFrameCount(sampleRate * duration)
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        let fadeFrames = max(1, Int(sampleRate * 0.008))
        if let channel = buffer.floatChannelData?[0] {
            for i in 0..<Int(frameCount) {
                let t = Double(i) / sampleRate
                let raw = sin(2.0 * Double.pi * frequencyHz * t)
                let fadeIn = min(1.0, Double(i) / Double(fadeFrames))
                let remaining = Int(frameCount) - 1 - i
                let fadeOut = min(1.0, Double(remaining) / Double(fadeFrames))
                channel[i] = Float(raw * min(fadeIn, fadeOut) * 0.22)
            }
        }

        await withCheckedContinuation { continuation in
            player.scheduleBuffer(buffer, at: nil, options: []) {
                continuation.resume()
            }
            player.play()
        }
    }

    func stop() {
        player.stop()
        engine.stop()
    }
}
