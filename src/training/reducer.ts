import type { SessionPhase, TrainingMode, TrainingState, ToleranceCents } from '../types';

export interface TrainingReducerState extends TrainingState {
  resumePhase: SessionPhase | null;
}

export type TrainingEvent =
  | { type: 'START_REFERENCE' }
  | { type: 'BEGIN_COUNT_IN' }
  | { type: 'BEGIN_LISTENING' }
  | { type: 'UPDATE_EVALUATION'; elapsedMs: number; validFrameRatio: number }
  | { type: 'SYNC_SETTINGS'; mode: TrainingMode; bpm: number; holdDurationMs: number | null; toleranceCents: ToleranceCents }
  | { type: 'CLEAR' }
  | { type: 'NEXT_TARGET'; targetNote: string; targetHz: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' };

export function createReducerState(state: TrainingState): TrainingReducerState {
  return { ...state, resumePhase: null };
}

export function trainingReducer(
  state: TrainingReducerState,
  event: TrainingEvent,
): TrainingReducerState {
  switch (event.type) {
    case 'START_REFERENCE':
      return { ...state, phase: 'referencePlaying', success: false, elapsedMs: 0, validFrameRatio: 0 };
    case 'BEGIN_COUNT_IN':
      return { ...state, phase: 'countIn' };
    case 'BEGIN_LISTENING':
      return { ...state, phase: 'listening' };
    case 'UPDATE_EVALUATION':
      return { ...state, elapsedMs: event.elapsedMs, validFrameRatio: event.validFrameRatio };
    case 'SYNC_SETTINGS':
      return {
        ...state,
        mode: event.mode,
        bpm: event.bpm,
        holdDurationMs: event.holdDurationMs,
        toleranceCents: event.toleranceCents,
      };
    case 'CLEAR':
      return { ...state, phase: 'success', success: true };
    case 'NEXT_TARGET':
      return {
        ...state,
        targetNote: event.targetNote,
        targetHz: event.targetHz,
        phase: 'idle',
        success: false,
        elapsedMs: 0,
        validFrameRatio: 0,
        resumePhase: null,
      };
    case 'PAUSE':
      if (state.phase === 'paused') return state;
      return { ...state, resumePhase: state.phase, phase: 'paused' };
    case 'RESUME':
      return { ...state, phase: state.resumePhase ?? 'idle', resumePhase: null };
    case 'STOP':
      return {
        ...state,
        phase: 'idle',
        success: false,
        elapsedMs: 0,
        validFrameRatio: 0,
        resumePhase: null,
      };
  }
}
