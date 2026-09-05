import { describe, expect, it } from 'vitest';
import { beatDurationMs, evaluationDurationMs } from './timing';

describe('training timing', () => {
  it('converts BPM into beat and bar durations', () => {
    expect(beatDurationMs(120)).toBe(500);
    expect(evaluationDurationMs('beat', 120)).toBe(500);
    expect(evaluationDurationMs('bar', 120)).toBe(2000);
    expect(evaluationDurationMs('twoBars', 120)).toBe(4000);
    expect(evaluationDurationMs('unlimited', 120)).toBeNull();
  });

  it('clamps BPM to the supported 40–200 range', () => {
    expect(beatDurationMs(10)).toBe(1500);
    expect(beatDurationMs(400)).toBe(300);
  });
});
