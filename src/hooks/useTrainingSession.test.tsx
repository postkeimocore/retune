import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, saveSettings } from '../settings/storage';
import { useTrainingSession } from './useTrainingSession';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

describe('useTrainingSession', () => {
  it('moves from reference to count-in to listening at the configured BPM', () => {
    const { result } = renderHook(() => useTrainingSession({ audioEnabled: false }));
    expect(result.current.state.phase).toBe('idle');

    act(() => result.current.start());
    expect(result.current.state.phase).toBe('referencePlaying');

    act(() => vi.advanceTimersByTime(700));
    expect(result.current.state.phase).toBe('countIn');

    act(() => vi.advanceTimersByTime(600));
    expect(result.current.state.phase).toBe('listening');
  });

  it('advances through the scale after a clear', () => {
    saveSettings({ ...DEFAULT_SETTINGS, mode: 'scale', rootMidi: 60, maxMidi: 84 });
    const { result } = renderHook(() => useTrainingSession({ audioEnabled: false }));
    expect(result.current.state.targetNote).toBe('C4');

    act(() => result.current.onSuccess());
    expect(result.current.state.phase).toBe('success');

    act(() => vi.advanceTimersByTime(550));
    expect(result.current.state.targetNote).toBe('D4');
    expect(result.current.state.phase).toBe('referencePlaying');
  });

  it('selects a different random target after a clear', () => {
    saveSettings({ ...DEFAULT_SETTINGS, mode: 'random', minMidi: 60, maxMidi: 61 });
    const { result } = renderHook(() =>
      useTrainingSession({ audioEnabled: false, rng: () => 0.99 }),
    );
    const first = result.current.state.targetNote;

    act(() => result.current.onSuccess());
    act(() => vi.advanceTimersByTime(550));

    expect(result.current.state.targetNote).not.toBe(first);
  });

  it('keeps the selected target in free mode after a clear', () => {
    saveSettings({ ...DEFAULT_SETTINGS, mode: 'free', freeMidi: 64 });
    const { result } = renderHook(() => useTrainingSession({ audioEnabled: false }));
    expect(result.current.state.targetNote).toBe('E4');

    act(() => result.current.onSuccess());
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.state.targetNote).toBe('E4');
    expect(result.current.state.phase).toBe('success');
  });
});
