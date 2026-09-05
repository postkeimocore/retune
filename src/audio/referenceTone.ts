export class ReferenceToneController {
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  constructor(private readonly context: AudioContext) {}

  play(frequency: number, gain = 0.08): void {
    this.stop();
    if (!(frequency > 0)) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(Math.max(0, Math.min(0.25, gain)), now + 0.015);
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    oscillator.start(now);

    this.oscillator = oscillator;
    this.gain = gainNode;
  }

  stop(): void {
    if (!this.oscillator || !this.gain) return;
    const now = this.context.currentTime;
    try {
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + 0.025);
      this.oscillator.stop(now + 0.035);
    } catch {
      try {
        this.oscillator.stop();
      } catch {
        // Node may already be stopped.
      }
    }
    this.oscillator.disconnect();
    this.gain.disconnect();
    this.oscillator = null;
    this.gain = null;
  }

  dispose(): void {
    this.stop();
  }
}
