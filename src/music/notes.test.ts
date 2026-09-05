import { describe, expect, it } from 'vitest';
import { noteNameToMidi, midiToFrequency, midiToNoteName } from './notes';

describe('musical note math', () => {
  it('maps A4 to MIDI 69 and 440 Hz', () => {
    expect(noteNameToMidi('A4')).toBe(69);
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it('maps middle C correctly', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToFrequency(60)).toBeCloseTo(261.6256, 3);
  });
});
