import { describe, expect, it } from 'vitest';
import { createPitchDetector } from './detector';

function sineWave(frequency: number, sampleRate = 48_000, size = 4096): Float32Array {
  const samples = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    samples[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.7;
  }
  return samples;
}

describe('pitch detector', () => {
  it.each([
    ['A3', 220],
    ['C4', 261.6256],
    ['E4', 329.6276],
    ['A4', 440],
  ])('detects %s generated sine wave', (_note, frequency) => {
    const detector = createPitchDetector({ minRms: 0.001, minConfidence: 0.75 });
    const result = detector.analyze(sineWave(frequency), 48_000, 1000);
    expect(result.isVoiced).toBe(true);
    expect(result.frequency).not.toBeNull();
    expect(result.frequency!).toBeCloseTo(frequency, 0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('rejects silence instead of inventing a pitch', () => {
    const detector = createPitchDetector();
    const result = detector.analyze(new Float32Array(4096), 48_000, 1000);
    expect(result.isVoiced).toBe(false);
    expect(result.frequency).toBeNull();
    expect(result.rms).toBe(0);
  });

  it('can reset smoothing state between target notes', () => {
    const detector = createPitchDetector({ minRms: 0.001, minConfidence: 0.75 });
    detector.analyze(sineWave(220), 48_000, 0);
    detector.reset();
    const result = detector.analyze(sineWave(440), 48_000, 100);
    expect(result.frequency!).toBeCloseTo(440, 0);
  });
});
