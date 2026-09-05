import { describe, expect, it } from 'vitest';
import { buildScaleSequence, pickRandomMidi, transposeRoot } from './modes';

describe('training mode target generation', () => {
  it('builds an ascending and descending major scale around the root', () => {
    expect(buildScaleSequence(60)).toEqual([
      60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60,
    ]);
  });

  it('transposes the root by one semitone', () => {
    expect(transposeRoot(60, 'up')).toBe(61);
    expect(transposeRoot(60, 'down')).toBe(59);
  });

  it('selects a random note in range without immediately repeating when alternatives exist', () => {
    expect(pickRandomMidi(60, 61, 60, () => 0)).toBe(61);
    expect(pickRandomMidi(60, 61, 61, () => 0.99)).toBe(60);
  });

  it('allows the only note when the configured range has one pitch', () => {
    expect(pickRandomMidi(64, 64, 64, () => 0.5)).toBe(64);
  });
});
