import { PitchDetector } from 'pitchy';

export interface DetectorFrame {
  timestamp: number;
  frequency: number | null;
  confidence: number;
  rms: number;
  isVoiced: boolean;
}

export interface PitchDetectorOptions {
  bufferSize?: number;
  minRms?: number;
  minConfidence?: number;
  historySize?: number;
}

export interface RealtimePitchDetector {
  analyze(samples: Float32Array, sampleRate: number, timestamp?: number): DetectorFrame;
  reset(): void;
}

function calculateRms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function createPitchDetector(options: PitchDetectorOptions = {}): RealtimePitchDetector {
  const bufferSize = options.bufferSize ?? 4096;
  const minRms = options.minRms ?? 0.008;
  const minConfidence = options.minConfidence ?? 0.78;
  const historySize = options.historySize ?? 5;
  const detector = PitchDetector.forFloat32Array(bufferSize);
  let history: number[] = [];

  const reset = () => {
    history = [];
  };

  const analyze = (
    samples: Float32Array,
    sampleRate: number,
    timestamp = typeof performance !== 'undefined' ? performance.now() : Date.now(),
  ): DetectorFrame => {
    const rms = calculateRms(samples);
    if (samples.length !== bufferSize || rms < minRms) {
      return { timestamp, frequency: null, confidence: 0, rms, isVoiced: false };
    }

    const [rawFrequency, confidence] = detector.findPitch(samples, sampleRate);
    if (!Number.isFinite(rawFrequency) || rawFrequency <= 0 || confidence < minConfidence) {
      return { timestamp, frequency: null, confidence, rms, isVoiced: false };
    }

    let candidate = rawFrequency;
    if (history.length > 0) {
      const stable = median(history);
      const ratio = candidate / stable;
      if (ratio >= 1.8 && ratio <= 2.2) candidate /= 2;
      else if (ratio >= 0.45 && ratio <= 0.56) candidate *= 2;
    }

    history.push(candidate);
    if (history.length > historySize) history.shift();
    const frequency = median(history);

    return { timestamp, frequency, confidence, rms, isVoiced: true };
  };

  return { analyze, reset };
}
