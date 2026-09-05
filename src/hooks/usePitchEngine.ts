import { useCallback, useEffect, useRef, useState } from 'react';
import { createPitchDetector } from '../audio/detector';
import { requestMicrophoneStream, stopMicrophoneStream } from '../audio/microphone';
import { ReferenceToneController } from '../audio/referenceTone';
import { frequencyToCents } from '../scoring/pitchMath';
import type { PitchFrame, ToleranceCents } from '../types';

export type MicrophonePermissionState = 'unknown' | 'granted' | 'denied' | 'unavailable';
export type PitchEngineActivationResult = 'ready' | 'permissionRequired' | 'unavailable';

export interface UsePitchEngineOptions {
  targetNote: string;
  targetHz: number;
  toleranceCents: ToleranceCents;
}

export function usePitchEngine({ targetNote, targetHz, toleranceCents }: UsePitchEngineOptions) {
  const [frame, setFrame] = useState<PitchFrame | null>(null);
  const [history, setHistory] = useState<PitchFrame[]>([]);
  const [permission, setPermission] = useState<MicrophonePermissionState>('unknown');
  const [error, setError] = useState<string | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const toneRef = useRef<ReferenceToneController | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const lastPublishRef = useRef(0);
  const detectorRef = useRef(createPitchDetector());
  const targetNoteRef = useRef(targetNote);
  const targetHzRef = useRef(targetHz);
  const toleranceRef = useRef(toleranceCents);

  targetNoteRef.current = targetNote;
  targetHzRef.current = targetHz;
  toleranceRef.current = toleranceCents;

  const ensureAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof AudioContext === 'undefined') {
      setError('このブラウザでは音声再生・解析を利用できません。');
      return null;
    }

    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new AudioContext();
      toneRef.current = new ReferenceToneController(contextRef.current);
    }

    const context = contextRef.current;
    if (context.state === 'suspended') await context.resume();
    return context;
  }, []);

  const stopReference = useCallback(() => {
    toneRef.current?.stop();
  }, []);

  const stopCapture = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;
    stopMicrophoneStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const analysisLoop = useCallback(() => {
    if (!activeRef.current) return;
    const analyser = analyserRef.current;
    const context = contextRef.current;
    const buffer = bufferRef.current;
    if (!analyser || !context || !buffer) return;

    analyser.getFloatTimeDomainData(buffer);
    const timestamp = performance.now();
    const detected = detectorRef.current.analyze(buffer, context.sampleRate, timestamp);

    if (timestamp - lastPublishRef.current >= 33) {
      lastPublishRef.current = timestamp;
      const detectedHz = detected.frequency;
      const centError = detectedHz === null ? null : frequencyToCents(detectedHz, targetHzRef.current);
      const nextFrame: PitchFrame = {
        timestamp,
        targetNote: targetNoteRef.current,
        targetHz: targetHzRef.current,
        detectedHz,
        centError,
        confidence: detected.confidence,
        rms: detected.rms,
        isVoiced: detected.isVoiced,
        isInTune: centError !== null && Math.abs(centError) <= toleranceRef.current,
      };
      setFrame(nextFrame);
      setHistory((current) => {
        const cutoff = timestamp - 3000;
        return [...current, nextFrame].filter((item) => item.timestamp >= cutoff).slice(-100);
      });
    }

    rafRef.current = requestAnimationFrame(analysisLoop);
  }, []);

  const deactivate = useCallback(() => {
    stopReference();
    stopCapture();
  }, [stopCapture, stopReference]);

  const activate = useCallback(async (): Promise<PitchEngineActivationResult> => {
    setError(null);

    const context = await ensureAudioContext();
    if (!context) {
      setPermission('unavailable');
      return 'unavailable';
    }

    try {
      if (!streamRef.current) {
        streamRef.current = await requestMicrophoneStream();
        setPermission('granted');
      }

      if (!analyserRef.current) {
        const source = context.createMediaStreamSource(streamRef.current);
        const analyser = context.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0;
        source.connect(analyser);
        sourceRef.current = source;
        analyserRef.current = analyser;
        bufferRef.current = new Float32Array(
          new ArrayBuffer(analyser.fftSize * Float32Array.BYTES_PER_ELEMENT),
        );
      }

      if (!activeRef.current) {
        activeRef.current = true;
        lastPublishRef.current = 0;
        rafRef.current = requestAnimationFrame(analysisLoop);
      }
      return 'ready';
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : '';
      stopCapture();

      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermission('denied');
        setError('マイクの許可が必要です。Safariのサイト設定でこのページの「マイク」を許可し、もう一度開始してください。基準音はそのまま再生できます。');
        return 'permissionRequired';
      }

      setPermission('unavailable');
      if (name === 'NotFoundError') {
        setError('使用できるマイクが見つかりません。マイク付き端末または入力デバイスを接続してから、もう一度開始してください。');
      } else if (name === 'NotSupportedError') {
        setError('このブラウザではマイク入力を利用できません。iPhoneではSafariから開いてください。');
      } else {
        setError('マイクを開始できませんでした。接続状態とブラウザ設定を確認して、もう一度開始してください。');
      }
      return 'unavailable';
    }
  }, [analysisLoop, ensureAudioContext, stopCapture]);

  const playReference = useCallback(async (frequency = targetHzRef.current): Promise<boolean> => {
    if (!(frequency > 0)) return false;
    const context = await ensureAudioContext();
    if (!context) return false;
    toneRef.current?.play(frequency);
    return true;
  }, [ensureAudioContext]);

  const resetDetector = useCallback(() => {
    detectorRef.current.reset();
    setFrame(null);
    setHistory([]);
  }, []);

  useEffect(() => {
    return () => {
      deactivate();
      toneRef.current?.dispose();
      toneRef.current = null;
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== 'closed') void context.close();
    };
  }, [deactivate]);

  return {
    frame,
    history,
    permission,
    error,
    activate,
    deactivate,
    playReference,
    stopReference,
    resetDetector,
  };
}
