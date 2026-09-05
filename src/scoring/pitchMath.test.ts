import { describe, expect, it } from 'vitest';
import { frequencyToCents, frequencyToNearestNote } from './pitchMath';

describe('pitch math', () => {
  it('returns zero cents for the target frequency', () => {
    expect(frequencyToCents(440, 440)).toBeCloseTo(0, 6);
  });

  it('returns +100 cents one equal-tempered semitone above', () => {
    expect(frequencyToCents(466.1637615, 440)).toBeCloseTo(100, 2);
  });

  it('finds nearest note and signed cents', () => {
    const result = frequencyToNearestNote(440);
    expect(result.note).toBe('A4');
    expect(result.midi).toBe(69);
    expect(result.cents).toBeCloseTo(0, 5);
  });
});
