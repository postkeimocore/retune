import type { TrainingMode, ToleranceCents } from '../types';
import type { TransposeDirection } from '../training/modes';
import type { EvaluationDuration } from '../training/timing';
import { clampBpm } from '../training/timing';

export const SETTINGS_STORAGE_KEY = 'retune:v0.1:settings';

export interface AppSettings {
  mode: TrainingMode;
  bpm: number;
  duration: EvaluationDuration;
  toleranceCents: ToleranceCents;
  minMidi: number;
  maxMidi: number;
  rootMidi: number;
  freeMidi: number;
  transposeDirection: TransposeDirection;
  continuousReference: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'free',
  bpm: 100,
  duration: 'bar',
  toleranceCents: 20,
  minMidi: 48,
  maxMidi: 72,
  rootMidi: 60,
  freeMidi: 60,
  transposeDirection: 'up',
  continuousReference: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampMidi(value: unknown, fallback: number): number {
  return Math.min(96, Math.max(24, Math.round(numberOr(value, fallback))));
}

export function normalizeSettings(value: unknown): AppSettings {
  const source = isRecord(value) ? value : {};
  const mode: TrainingMode =
    source.mode === 'scale' || source.mode === 'random' || source.mode === 'free'
      ? source.mode
      : DEFAULT_SETTINGS.mode;
  const duration: EvaluationDuration =
    source.duration === 'beat' ||
    source.duration === 'bar' ||
    source.duration === 'twoBars' ||
    source.duration === 'unlimited'
      ? source.duration
      : DEFAULT_SETTINGS.duration;
  const toleranceCents: ToleranceCents =
    source.toleranceCents === 10 || source.toleranceCents === 20 || source.toleranceCents === 30
      ? source.toleranceCents
      : DEFAULT_SETTINGS.toleranceCents;
  const transposeDirection: TransposeDirection =
    source.transposeDirection === 'down' ? 'down' : 'up';

  let minMidi = clampMidi(source.minMidi, DEFAULT_SETTINGS.minMidi);
  let maxMidi = clampMidi(source.maxMidi, DEFAULT_SETTINGS.maxMidi);
  if (minMidi > maxMidi) [minMidi, maxMidi] = [maxMidi, minMidi];

  const rootMidi = Math.min(maxMidi, Math.max(minMidi, clampMidi(source.rootMidi, DEFAULT_SETTINGS.rootMidi)));
  const freeMidi = Math.min(maxMidi, Math.max(minMidi, clampMidi(source.freeMidi, DEFAULT_SETTINGS.freeMidi)));

  return {
    mode,
    bpm: clampBpm(numberOr(source.bpm, DEFAULT_SETTINGS.bpm)),
    duration,
    toleranceCents,
    minMidi,
    maxMidi,
    rootMidi,
    freeMidi,
    transposeDirection,
    continuousReference:
      typeof source.continuousReference === 'boolean'
        ? source.continuousReference
        : DEFAULT_SETTINGS.continuousReference,
  };
}

export function loadSettings(): AppSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): AppSettings {
  const normalized = normalizeSettings(settings);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}
