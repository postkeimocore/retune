export type TrainingMode = 'free' | 'scale' | 'random';
export type ToleranceCents = 10 | 20 | 30;
export type SessionPhase =
  | 'idle'
  | 'referencePlaying'
  | 'countIn'
  | 'listening'
  | 'evaluating'
  | 'success'
  | 'paused'
  | 'microphonePermissionRequired'
  | 'microphoneUnavailable';

export interface PitchFrame {
  timestamp: number;
  targetNote: string;
  targetHz: number;
  detectedHz: number | null;
  centError: number | null;
  confidence: number;
  rms: number;
  isVoiced: boolean;
  isInTune: boolean;
}

export interface TrainingState {
  mode: TrainingMode;
  targetNote: string;
  targetHz: number;
  bpm: number;
  holdDurationMs: number | null;
  toleranceCents: ToleranceCents;
  validFrameRatio: number;
  elapsedMs: number;
  success: boolean;
  phase: SessionPhase;
}
