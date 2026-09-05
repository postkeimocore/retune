export type TransposeDirection = 'up' | 'down';

export const MAJOR_SCALE_ROUND_TRIP_INTERVALS = [
  0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0,
] as const;

export function buildScaleSequence(rootMidi: number): number[] {
  return MAJOR_SCALE_ROUND_TRIP_INTERVALS.map((interval) => rootMidi + interval);
}

export function transposeRoot(rootMidi: number, direction: TransposeDirection): number {
  return rootMidi + (direction === 'up' ? 1 : -1);
}

export function pickRandomMidi(
  minMidi: number,
  maxMidi: number,
  previousMidi?: number,
  rng: () => number = Math.random,
): number {
  const low = Math.ceil(Math.min(minMidi, maxMidi));
  const high = Math.floor(Math.max(minMidi, maxMidi));
  const values: number[] = [];
  for (let midi = low; midi <= high; midi += 1) {
    if (midi !== previousMidi || low === high) values.push(midi);
  }
  if (values.length === 0) return low;
  const index = Math.min(values.length - 1, Math.floor(Math.max(0, Math.min(0.999999999, rng())) * values.length));
  return values[index];
}
