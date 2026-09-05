const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const PITCH_CLASS_TO_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  'B#': 0,
};

export function noteNameToMidi(note: string): number {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!match) throw new Error(`Invalid note name: ${note}`);

  const [, letter, accidental, octaveText] = match;
  const pitchClass = `${letter.toUpperCase()}${accidental}`;
  const index = PITCH_CLASS_TO_INDEX[pitchClass];
  if (index === undefined) throw new Error(`Invalid pitch class: ${pitchClass}`);

  let octave = Number(octaveText);
  if (pitchClass === 'B#') octave += 1;
  if (pitchClass === 'Cb') octave -= 1;
  return (octave + 1) * 12 + index;
}

export function midiToNoteName(midi: number): string {
  if (!Number.isFinite(midi)) throw new Error('MIDI note must be finite');
  const rounded = Math.round(midi);
  const pitchClass = PITCH_CLASSES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${pitchClass}${octave}`;
}

export function midiToFrequency(midi: number, a4 = 440): number {
  if (!(a4 > 0)) throw new Error('A4 reference frequency must be positive');
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function noteToFrequency(note: string, a4 = 440): number {
  return midiToFrequency(noteNameToMidi(note), a4);
}

export function frequencyToMidi(frequency: number, a4 = 440): number {
  if (!(frequency > 0) || !(a4 > 0)) throw new Error('Frequencies must be positive');
  return 69 + 12 * Math.log2(frequency / a4);
}

export { PITCH_CLASSES };
