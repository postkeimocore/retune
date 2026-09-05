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
  let lastEligibleTimestamp: number | null = null;
  let lastFrameTimestamp: number | null = null;
  let lastFrameEligible = false;
  let lastFrameInTune = false;

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
    lastEligibleTimestamp = null;
    lastFrameTimestamp = null;
    lastFrameEligible = false;
    lastFrameInTune = false;
  };

  const startSegment = (frame: PitchFrame) => {
    segmentStart = frame.timestamp;
    lastEligibleTimestamp = frame.timestamp;
    lastFrameTimestamp = frame.timestamp;
    lastFrameEligible = true;
    lastFrameInTune = Math.abs(frame.centError!) <= config.toleranceCents;
  };

  const push = (frame: PitchFrame): HoldScoreSnapshot => {
    const eligibleFrame =
      frame.isVoiced &&
      frame.detectedHz !== null &&
      frame.centError !== null &&
      frame.confidence >= config.minConfidence &&
      frame.rms >= config.minRms;

    if (segmentStart === null || lastEligibleTimestamp === null) {
      if (eligibleFrame) {
        startSegment(frame);
      } else {
        lastFrameTimestamp = frame.timestamp;
        lastFrameEligible = false;
        lastFrameInTune = false;
      }
      return makeSnapshot();
    }

    if (frame.timestamp - lastEligibleTimestamp > config.maxGapMs) {
      eligibleMs = 0;
      inTuneMs = 0;
      segmentStart = null;
      lastEligibleTimestamp = null;
      lastFrameTimestamp = frame.timestamp;
      lastFrameEligible = false;
      lastFrameInTune = false;
      if (eligibleFrame) startSegment(frame);
      return makeSnapshot();
    }

    if (lastFrameTimestamp !== null && lastFrameEligible) {
      const scoringStart = segmentStart + config.onsetGraceMs;
      const intervalStart = Math.max(lastFrameTimestamp, scoringStart);
      const delta = Math.max(0, frame.timestamp - intervalStart);
      eligibleMs += delta;
      if (lastFrameInTune) inTuneMs += delta;
    }

    lastFrameTimestamp = frame.timestamp;
    lastFrameEligible = eligibleFrame;
    lastFrameInTune = eligibleFrame && Math.abs(frame.centError!) <= config.toleranceCents;
    if (eligibleFrame) lastEligibleTimestamp = frame.timestamp;

    return makeSnapshot();
  };

  return { push, snapshot: makeSnapshot, reset };
}
