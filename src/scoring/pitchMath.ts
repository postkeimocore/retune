import { frequencyToMidi, midiToFrequency, midiToNoteName } from '../music/notes';

export function frequencyToCents(detectedHz: number, targetHz: number): number {
  if (!(detectedHz > 0) || !(targetHz > 0)) throw new Error('Frequencies must be positive');
  return 1200 * Math.log2(detectedHz / targetHz);
}

export function frequencyToNearestNote(
  frequency: number,
  a4 = 440,
): { note: string; midi: number; cents: number } {
  const midiFloat = frequencyToMidi(frequency, a4);
  const midi = Math.round(midiFloat);
  const targetHz = midiToFrequency(midi, a4);
  return {
    note: midiToNoteName(midi),
    midi,
    cents: frequencyToCents(frequency, targetHz),
  };
}
