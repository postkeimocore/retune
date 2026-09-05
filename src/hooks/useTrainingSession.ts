import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { midiToFrequency, midiToNoteName } from '../music/notes';
import { createHoldScorer, type HoldScoreSnapshot } from '../scoring/holdScorer';
import type { AppSettings } from '../settings/storage';
import { buildScaleSequence, pickRandomMidi, transposeRoot } from '../training/modes';
import { createReducerState, trainingReducer } from '../training/reducer';
import { beatDurationMs, evaluationDurationMs } from '../training/timing';
import type { TrainingState } from '../types';
import { usePitchEngine } from './usePitchEngine';
import { useSettings } from './useSettings';

const EMPTY_HOLD: HoldScoreSnapshot = {
  eligibleMs: 0,
  inTuneMs: 0,
  validFrameRatio: 0,
  progress: 0,
  success: false,
};

export interface UseTrainingSessionOptions {
  audioEnabled?: boolean;
  rng?: () => number;
}

function initialMidi(settings: AppSettings, rng: () => number): number {
  if (settings.mode === 'free') return settings.freeMidi;
  if (settings.mode === 'scale') return settings.rootMidi;
  return pickRandomMidi(settings.minMidi, settings.maxMidi, undefined, rng);
}

export function useTrainingSession(options: UseTrainingSessionOptions = {}) {
  const audioEnabled = options.audioEnabled ?? true;
  const rngRef = useRef(options.rng ?? Math.random);
  rngRef.current = options.rng ?? Math.random;
  const { settings, updateSettings, resetSettings } = useSettings();

  const initialMidiRef = useRef<number | null>(null);
  if (initialMidiRef.current === null) initialMidiRef.current = initialMidi(settings, rngRef.current);
  const firstMidi = initialMidiRef.current;
  const initialHoldMs = evaluationDurationMs(settings.duration, settings.bpm);

  const initialState: TrainingState = {
    mode: settings.mode,
    targetNote: midiToNoteName(firstMidi),
    targetHz: midiToFrequency(firstMidi),
    bpm: settings.bpm,
    holdDurationMs: initialHoldMs,
    toleranceCents: settings.toleranceCents,
    validFrameRatio: 0,
    elapsedMs: 0,
    success: false,
    phase: 'idle',
  };

  const [state, dispatch] = useReducer(trainingReducer, initialState, createReducerState);
  const [hold, setHold] = useState<HoldScoreSnapshot>(EMPTY_HOLD);
  const pitchEngine = usePitchEngine({
    targetNote: state.targetNote,
    targetHz: state.targetHz,
    toleranceCents: settings.toleranceCents,
  });

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const successTriggeredRef = useRef(false);
  const scaleRootRef = useRef(settings.rootMidi);
  const scaleIndexRef = useRef(0);
  const randomPreviousRef = useRef(settings.mode === 'random' ? firstMidi : undefined);
  const holdDurationMs = useMemo(
    () => evaluationDurationMs(settings.duration, settings.bpm),
    [settings.duration, settings.bpm],
  );
  const scorerRef = useRef(
    createHoldScorer({
      requiredMs: holdDurationMs ?? 1,
      toleranceCents: settings.toleranceCents,
      minConfidence: 0.78,
      minRms: 0.008,
      onsetGraceMs: 200,
      maxGapMs: 180,
    }),
  );

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timer = setTimeout(callback, delayMs);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const resetAttempt = useCallback(() => {
    scorerRef.current.reset();
    setHold(EMPTY_HOLD);
    successTriggeredRef.current = false;
    pitchEngine.resetDetector();
  }, [pitchEngine.resetDetector]);

  const runPreparedAttempt = useCallback(
    (targetHz: number) => {
      clearTimers();
      resetAttempt();
      dispatch({ type: 'START_REFERENCE' });

      if (audioEnabled) void pitchEngine.playReference(targetHz);

      schedule(() => {
        if (!settings.continuousReference) pitchEngine.stopReference();
        dispatch({ type: 'BEGIN_COUNT_IN' });
        schedule(() => dispatch({ type: 'BEGIN_LISTENING' }), beatDurationMs(settings.bpm));
      }, 700);
    },
    [
      audioEnabled,
      clearTimers,
      pitchEngine.playReference,
      pitchEngine.stopReference,
      resetAttempt,
      schedule,
      settings.bpm,
      settings.continuousReference,
    ],
  );

  const beginAttempt = useCallback(
    (targetNote: string, targetHz: number) => {
      void targetNote;
      if (!audioEnabled) {
        runPreparedAttempt(targetHz);
        return;
      }

      clearTimers();
      resetAttempt();
      void pitchEngine.activate().then((result) => {
        if (result !== 'ready') {
          dispatch({ type: 'STOP' });
          return;
        }
        runPreparedAttempt(targetHz);
      });
    },
    [audioEnabled, clearTimers, pitchEngine.activate, resetAttempt, runPreparedAttempt],
  );

  const advanceTargetAndStart = useCallback(() => {
    let nextMidi: number | null = null;

    if (settings.mode === 'scale') {
      let sequence = buildScaleSequence(scaleRootRef.current);
      if (scaleIndexRef.current < sequence.length - 1) {
        scaleIndexRef.current += 1;
      } else {
        const nextRoot = transposeRoot(scaleRootRef.current, settings.transposeDirection);
        sequence = buildScaleSequence(nextRoot);
        const low = Math.min(...sequence);
        const high = Math.max(...sequence);
        if (low < settings.minMidi || high > settings.maxMidi) {
          dispatch({ type: 'STOP' });
          pitchEngine.stopReference();
          return;
        }
        scaleRootRef.current = nextRoot;
        scaleIndexRef.current = 0;
      }
      nextMidi = sequence[scaleIndexRef.current];
    } else if (settings.mode === 'random') {
      nextMidi = pickRandomMidi(
        settings.minMidi,
        settings.maxMidi,
        randomPreviousRef.current,
        rngRef.current,
      );
      randomPreviousRef.current = nextMidi;
    } else {
      nextMidi = settings.freeMidi;
    }

    const targetNote = midiToNoteName(nextMidi);
    const targetHz = midiToFrequency(nextMidi);
    dispatch({ type: 'NEXT_TARGET', targetNote, targetHz });
    beginAttempt(targetNote, targetHz);
  }, [beginAttempt, pitchEngine.stopReference, settings]);

  const onSuccess = useCallback(() => {
    if (successTriggeredRef.current) return;
    successTriggeredRef.current = true;
    clearTimers();
    pitchEngine.stopReference();
    dispatch({ type: 'CLEAR' });

    if (settings.mode === 'scale' || settings.mode === 'random') {
      schedule(advanceTargetAndStart, 550);
    }
  }, [advanceTargetAndStart, clearTimers, pitchEngine.stopReference, schedule, settings.mode]);

  const start = useCallback(() => {
    beginAttempt(state.targetNote, state.targetHz);
  }, [beginAttempt, state.targetHz, state.targetNote]);

  const retry = start;

  const next = useCallback(() => {
    clearTimers();
    if (settings.mode === 'free') beginAttempt(state.targetNote, state.targetHz);
    else advanceTargetAndStart();
  }, [advanceTargetAndStart, beginAttempt, clearTimers, settings.mode, state.targetHz, state.targetNote]);

  const pause = useCallback(() => {
    clearTimers();
    pitchEngine.stopReference();
    dispatch({ type: 'PAUSE' });
  }, [clearTimers, pitchEngine.stopReference]);

  const resume = useCallback(() => {
    if (!audioEnabled) {
      dispatch({ type: 'RESUME' });
      return;
    }

    void pitchEngine.activate().then((result) => {
      if (result !== 'ready') return;
      dispatch({ type: 'RESUME' });
      if (settings.continuousReference) void pitchEngine.playReference(state.targetHz);
    });
  }, [audioEnabled, pitchEngine.activate, pitchEngine.playReference, settings.continuousReference, state.targetHz]);

  const stop = useCallback(() => {
    clearTimers();
    pitchEngine.stopReference();
    dispatch({ type: 'STOP' });
  }, [clearTimers, pitchEngine.stopReference]);

  const playReference = useCallback(() => {
    if (!audioEnabled) return;
    void pitchEngine.playReference(state.targetHz).then((played) => {
      if (played) schedule(pitchEngine.stopReference, 900);
    });
  }, [audioEnabled, pitchEngine.playReference, pitchEngine.stopReference, schedule, state.targetHz]);

  useEffect(() => {
    scorerRef.current = createHoldScorer({
      requiredMs: holdDurationMs ?? 1,
      toleranceCents: settings.toleranceCents,
      minConfidence: 0.78,
      minRms: 0.008,
      onsetGraceMs: 200,
      maxGapMs: 180,
    });
    setHold(EMPTY_HOLD);
    dispatch({
      type: 'SYNC_SETTINGS',
      mode: settings.mode,
      bpm: settings.bpm,
      holdDurationMs,
      toleranceCents: settings.toleranceCents,
    });
  }, [holdDurationMs, settings.bpm, settings.mode, settings.toleranceCents]);

  useEffect(() => {
    clearTimers();
    pitchEngine.stopReference();
    successTriggeredRef.current = false;
    scaleRootRef.current = settings.rootMidi;
    scaleIndexRef.current = 0;

    let targetMidi: number;
    if (settings.mode === 'free') {
      targetMidi = settings.freeMidi;
    } else if (settings.mode === 'scale') {
      targetMidi = settings.rootMidi;
    } else {
      targetMidi = pickRandomMidi(settings.minMidi, settings.maxMidi, undefined, rngRef.current);
      randomPreviousRef.current = targetMidi;
    }
    dispatch({
      type: 'NEXT_TARGET',
      targetNote: midiToNoteName(targetMidi),
      targetHz: midiToFrequency(targetMidi),
    });
  }, [
    clearTimers,
    pitchEngine.stopReference,
    settings.freeMidi,
    settings.maxMidi,
    settings.minMidi,
    settings.mode,
    settings.rootMidi,
  ]);

  useEffect(() => {
    if (state.phase !== 'listening' || !pitchEngine.frame || holdDurationMs === null) return;
    const nextHold = scorerRef.current.push(pitchEngine.frame);
    setHold(nextHold);
    dispatch({
      type: 'UPDATE_EVALUATION',
      elapsedMs: nextHold.eligibleMs,
      validFrameRatio: nextHold.validFrameRatio,
    });
    if (nextHold.success) onSuccess();
  }, [holdDurationMs, onSuccess, pitchEngine.frame, state.phase]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      clearTimers();
      pitchEngine.stopReference();
      pitchEngine.deactivate();
      if (state.phase !== 'idle' && state.phase !== 'success' && state.phase !== 'paused') {
        dispatch({ type: 'PAUSE' });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [clearTimers, pitchEngine.deactivate, pitchEngine.stopReference, state.phase]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    state,
    settings,
    updateSettings,
    resetSettings,
    frame: pitchEngine.frame,
    history: pitchEngine.history,
    permission: pitchEngine.permission,
    audioError: pitchEngine.error,
    hold,
    start,
    pause,
    resume,
    stop,
    retry,
    next,
    onSuccess,
    playReference,
  };
}
