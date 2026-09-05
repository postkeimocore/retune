import { describe, expect, it } from 'vitest';
import type { TrainingState } from '../types';
import { createReducerState, trainingReducer } from './reducer';

const baseState: TrainingState = {
  mode: 'free',
  targetNote: 'C4',
  targetHz: 261.625565,
  bpm: 100,
  holdDurationMs: 2400,
  toleranceCents: 20,
  validFrameRatio: 0,
  elapsedMs: 0,
  success: false,
  phase: 'idle',
};

describe('training state reducer', () => {
  it('moves through reference, count-in, listening and success', () => {
    let state = createReducerState(baseState);
    state = trainingReducer(state, { type: 'START_REFERENCE' });
    expect(state.phase).toBe('referencePlaying');
    state = trainingReducer(state, { type: 'BEGIN_COUNT_IN' });
    expect(state.phase).toBe('countIn');
    state = trainingReducer(state, { type: 'BEGIN_LISTENING' });
    expect(state.phase).toBe('listening');
    state = trainingReducer(state, { type: 'CLEAR' });
    expect(state.phase).toBe('success');
    expect(state.success).toBe(true);
  });

  it('pauses and resumes to the prior active phase', () => {
    let state = createReducerState({ ...baseState, phase: 'listening' });
    state = trainingReducer(state, { type: 'PAUSE' });
    expect(state.phase).toBe('paused');
    state = trainingReducer(state, { type: 'RESUME' });
    expect(state.phase).toBe('listening');
  });

  it('updates the target and resets attempt state for the next pitch', () => {
    const state = trainingReducer(createReducerState({ ...baseState, success: true, phase: 'success' }), {
      type: 'NEXT_TARGET',
      targetNote: 'D4',
      targetHz: 293.664768,
    });
    expect(state.targetNote).toBe('D4');
    expect(state.phase).toBe('idle');
    expect(state.success).toBe(false);
    expect(state.elapsedMs).toBe(0);
  });
});
