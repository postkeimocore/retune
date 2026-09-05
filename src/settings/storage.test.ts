import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, loadSettings, saveSettings } from './storage';

beforeEach(() => localStorage.clear());

describe('settings storage', () => {
  it('returns defaults when no saved settings exist', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips valid settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, bpm: 132, mode: 'random', toleranceCents: 10 });
    expect(loadSettings()).toMatchObject({ bpm: 132, mode: 'random', toleranceCents: 10 });
  });

  it('falls back safely from malformed data', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{broken');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('normalizes invalid ranges and unsupported values', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      ...DEFAULT_SETTINGS,
      bpm: 999,
      toleranceCents: 12,
      minMidi: 90,
      maxMidi: 40,
      mode: 'unknown',
    }));
    const settings = loadSettings();
    expect(settings.bpm).toBe(200);
    expect(settings.toleranceCents).toBe(20);
    expect(settings.mode).toBe('free');
    expect(settings.minMidi).toBeLessThanOrEqual(settings.maxMidi);
  });
});
