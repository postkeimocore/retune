import { describe, expect, it } from 'vitest';
import type { PitchFrame } from '../types';
import { createHoldScorer } from './holdScorer';

function frame(
  timestamp: number,
  centError: number | null,
  confidence = 0.98,
  rms = 0.08,
): PitchFrame {
  return {
    timestamp,
    targetNote: 'A4',
    targetHz: 440,
    detectedHz: centError === null ? null : 440 * Math.pow(2, centError / 1200),
    centError,
    confidence,
    rms,
    isVoiced: centError !== null,
    isInTune: centError !== null && Math.abs(centError) <= 20,
  };
}

const config = {
  requiredMs: 1000,
  toleranceCents: 20 as const,
  minConfidence: 0.9,
  minRms: 0.01,
  onsetGraceMs: 200,
  maxGapMs: 180,
};

describe('hold scorer', () => {
  it('clears when at least 80 percent of eligible time is in tune', () => {
    const scorer = createHoldScorer(config);
    for (let t = 0; t <= 1300; t += 50) {
      scorer.push(frame(t, t < 200 ? 30 : 5));
    }
    expect(scorer.snapshot().success).toBe(true);
    expect(scorer.snapshot().validFrameRatio).toBeGreaterThanOrEqual(0.8);
  });

  it('does not count a low-confidence frame as a wrong note', () => {
    const scorer = createHoldScorer({ ...config, requiredMs: 500, onsetGraceMs: 0 });
    scorer.push(frame(0, 0));
    scorer.push(frame(100, 0));
    scorer.push(frame(150, 45, 0.3));
    scorer.push(frame(200, 0));
    scorer.push(frame(300, 0));
    scorer.push(frame(400, 0));
    scorer.push(frame(500, 0));
    const result = scorer.snapshot();
    expect(result.validFrameRatio).toBe(1);
    expect(result.success).toBe(true);
  });

  it('does not clear when more than 20 percent of eligible time is outside tolerance', () => {
    const scorer = createHoldScorer({ ...config, onsetGraceMs: 0 });
    for (let t = 0; t <= 1000; t += 50) {
      scorer.push(frame(t, t < 300 ? 35 : 5));
    }
    expect(scorer.snapshot().validFrameRatio).toBeLessThan(0.8);
    expect(scorer.snapshot().success).toBe(false);
  });

  it('resets active progress after a long voiced gap', () => {
    const scorer = createHoldScorer({ ...config, requiredMs: 500, onsetGraceMs: 0 });
    scorer.push(frame(0, 0));
    scorer.push(frame(100, 0));
    scorer.push(frame(200, 0));
    scorer.push(frame(500, 0));
    scorer.push(frame(600, 0));
    expect(scorer.snapshot().eligibleMs).toBeLessThan(500);
    expect(scorer.snapshot().success).toBe(false);
  });
});
