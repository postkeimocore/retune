import type { PitchFrame, ToleranceCents } from '../types';

export interface HoldScorerConfig {
  requiredMs: number;
  toleranceCents: ToleranceCents;
  minConfidence: number;
  minRms: number;
  onsetGraceMs: number;
  maxGapMs: number;
  successRatio?: number;
}

export interface HoldScoreSnapshot {
  eligibleMs: number;
  inTuneMs: number;
  validFrameRatio: number;
  progress: number;
  success: boolean;
}

export interface HoldScorer {
  push(frame: PitchFrame): HoldScoreSnapshot;
  snapshot(): HoldScoreSnapshot;
  reset(): void;
}

export function createHoldScorer(config: HoldScorerConfig): HoldScorer {
  const successRatio = config.successRatio ?? 0.8;
  let eligibleMs = 0;
  let inTuneMs = 0;
  let segmentStart: number | null = null;
  let lastValidTimestamp: number | null = null;
  let lastScoredTimestamp: number | null = null;
  let lastScoredInTune = false;

  const makeSnapshot = (): HoldScoreSnapshot => {
    const validFrameRatio = eligibleMs > 0 ? inTuneMs / eligibleMs : 0;
    return {
      eligibleMs,
      inTuneMs,
      validFrameRatio,
      progress: Math.min(1, eligibleMs / Math.max(1, config.requiredMs)),
      success: eligibleMs >= config.requiredMs && validFrameRatio >= successRatio,
    };
  };

  const reset = () => {
    eligibleMs = 0;
    inTuneMs = 0;
    segmentStart = null;
    lastValidTimestamp = null;
    lastScoredTimestamp = null;
    lastScoredInTune = false;
  };

  const startSegment = (timestamp: number) => {
    segmentStart = timestamp;
    lastValidTimestamp = timestamp;
    lastScoredTimestamp = null;
    lastScoredInTune = false;
  };

  const push = (frame: PitchFrame): HoldScoreSnapshot => {
    const eligibleFrame =
      frame.isVoiced &&
      frame.detectedHz !== null &&
      frame.centError !== null &&
      frame.confidence >= config.minConfidence &&
      frame.rms >= config.minRms;

    if (!eligibleFrame) return makeSnapshot();

    if (lastValidTimestamp === null) {
      startSegment(frame.timestamp);
      return makeSnapshot();
    }

    if (frame.timestamp - lastValidTimestamp > config.maxGapMs) {
      eligibleMs = 0;
      inTuneMs = 0;
      startSegment(frame.timestamp);
      return makeSnapshot();
    }

    lastValidTimestamp = frame.timestamp;

    if (segmentStart === null) segmentStart = frame.timestamp;
    if (frame.timestamp - segmentStart < config.onsetGraceMs) {
      lastScoredTimestamp = null;
      return makeSnapshot();
    }

    const currentInTune = Math.abs(frame.centError!) <= config.toleranceCents;

    if (lastScoredTimestamp === null) {
      lastScoredTimestamp = frame.timestamp;
      lastScoredInTune = currentInTune;
      return makeSnapshot();
    }

    const delta = Math.max(0, frame.timestamp - lastScoredTimestamp);
    eligibleMs += delta;
    if (lastScoredInTune) inTuneMs += delta;

    lastScoredTimestamp = frame.timestamp;
    lastScoredInTune = currentInTune;
    return makeSnapshot();
  };

  return { push, snapshot: makeSnapshot, reset };
}
