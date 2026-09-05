export type EvaluationDuration = 'beat' | 'bar' | 'twoBars' | 'unlimited';

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return 100;
  return Math.min(200, Math.max(40, bpm));
}

export function beatDurationMs(bpm: number): number {
  return 60_000 / clampBpm(bpm);
}

export function evaluationDurationMs(kind: EvaluationDuration, bpm: number): number | null {
  const beat = beatDurationMs(bpm);
  switch (kind) {
    case 'beat':
      return beat;
    case 'bar':
      return beat * 4;
    case 'twoBars':
      return beat * 8;
    case 'unlimited':
      return null;
  }
}
