import { useEffect, useMemo, useState } from 'react';
import { midiToNoteName } from './music/notes';
import { useTrainingSession } from './hooks/useTrainingSession';
import type { PitchFrame, TrainingMode } from './types';

const MODE_COPY: Record<TrainingMode, { label: string; detail: string }> = {
  free: { label: 'フリー', detail: '選んだ1音を繰り返し着地' },
  scale: { label: 'スケール', detail: '音階を順番にたどって着地' },
  random: { label: 'ランダム', detail: '音域内の音へ瞬時に着地' },
};

const DURATION_OPTIONS = [
  ['beat', '1拍'],
  ['bar', '1小節'],
  ['twoBars', '2小節'],
  ['unlimited', '無制限'],
] as const;

const NOTE_OPTIONS = Array.from({ length: 61 }, (_, index) => index + 36);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function buildPitchPath(history: PitchFrame[]): string {
  const points = history.slice(-72).filter((item) => item.centError !== null);
  if (points.length < 2) return '';

  return points
    .map((item, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const cents = clamp(item.centError ?? 0, -50, 50);
      const y = 50 - cents;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function phaseLabel(phase: string) {
  switch (phase) {
    case 'referencePlaying':
      return '基準音を確認中';
    case 'countIn':
      return '息を整えて';
    case 'listening':
      return '録音中';
    case 'success':
      return 'CLEAR';
    case 'paused':
      return '一時停止中';
    default:
      return '準備完了';
  }
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h2.2l1.4-5.2 2.7 10.4L12 4l2.7 13.2 2.1-8.2 1.2 3H21" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10v4h4l5 4V6l-5 4H5Z" />
      <path d="M17 9.2a4.2 4.2 0 0 1 0 5.6M19.3 7a7.2 7.2 0 0 1 0 10" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" />
      <path d="m19 13.2 1.5 1.2-1.7 3-1.9-.7a7.4 7.4 0 0 1-2 1.2l-.3 2h-3.4l-.3-2a7.4 7.4 0 0 1-2-1.2l-1.9.7-1.7-3L7 13.2a7.5 7.5 0 0 1 0-2.4L5.3 9.6l1.7-3 1.9.7a7.4 7.4 0 0 1 2-1.2l.3-2h3.4l.3 2a7.4 7.4 0 0 1 2 1.2l1.9-.7 1.7 3-1.5 1.2a7.5 7.5 0 0 1 0 2.4Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
    </svg>
  );
}

export default function App() {
  const session = useTrainingSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    state,
    settings,
    updateSettings,
    resetSettings,
    frame,
    history,
    hold,
    permission,
    audioError,
  } = session;

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen]);

  const centError = frame?.centError ?? null;
  const centPosition = centError === null ? 50 : clamp((centError + 50) / 100) * 100;
  const pitchPath = useMemo(() => buildPitchPath(history), [history]);
  const holdProgress = clamp(hold.progress);
  const inputLevel = frame?.isVoiced ? clamp((frame.rms ?? 0) * 24) : 0;
  const activeBars = Math.round(inputLevel * 14);
  const isActive = !['idle', 'success', 'paused'].includes(state.phase);
  const isListening = state.phase === 'listening';

  const deviationTone =
    centError === null
      ? 'waiting'
      : Math.abs(centError) <= settings.toleranceCents
        ? 'good'
        : centError > 0
          ? 'high'
          : 'low';

  const deviationText =
    centError === null
      ? '声を待っています'
      : Math.abs(centError) <= settings.toleranceCents
        ? '目標音の中心です'
        : centError > 0
          ? '少し高めです'
          : '少し低めです';

  const primaryLabel = state.phase === 'paused'
    ? 'トレーニングを再開'
    : state.phase === 'idle'
      ? 'トレーニングを開始'
      : state.phase === 'success'
        ? 'もう一度トレーニング'
        : '一時停止';

  const handlePrimary = () => {
    if (state.phase === 'paused') session.resume();
    else if (state.phase === 'idle') session.start();
    else if (state.phase === 'success') session.retry();
    else session.pause();
  };

  const changeMode = (mode: TrainingMode) => {
    session.stop();
    updateSettings({ mode });
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="app-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true"><WaveIcon /></div>
            <div>
              <h1>RETUNE</h1>
              <p>Pitch landing trainer</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="設定を開く"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon />
          </button>
        </header>

        <nav className="mode-switch" aria-label="Training mode">
          {(['free', 'scale', 'random'] as TrainingMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={settings.mode === mode}
              onClick={() => changeMode(mode)}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </nav>

        <section className="coach-intro">
          <div>
            <span className="eyebrow">{MODE_COPY[settings.mode].label}</span>
            <h2>目標の音に、まっすぐ着地する。</h2>
            <p>{MODE_COPY[settings.mode].detail}。音の入り口と安定までをリアルタイムに可視化します。</p>
          </div>
          <div className={`phase-pill phase-${state.phase}`}>
            <span className="phase-dot" />
            {phaseLabel(state.phase)}
          </div>
        </section>

        <section className="pitch-stage glass-card" aria-label="Pitch training display">
          <div className="stage-header">
            <div className="stage-kicker">
              <span>TARGET NOTE</span>
              <strong>{settings.toleranceCents > 0 ? `±${settings.toleranceCents} cent` : ''}</strong>
            </div>
            <div className="target-cluster">
              <div className="target-note-block">
                <span>目標音</span>
                <strong>{state.targetNote}</strong>
                <small>{state.targetHz.toFixed(1)} Hz</small>
              </div>
              <button
                type="button"
                className="reference-button"
                aria-label="基準音を聴く"
                onClick={session.playReference}
              >
                <SpeakerIcon />
              </button>
            </div>
          </div>

          <div className="pitch-chart-wrap">
            <div className="chart-axis chart-axis-top"><span>+50</span><span>cent</span></div>
            <div className="chart-axis chart-axis-mid"><span>0</span><span>target</span></div>
            <div className="chart-axis chart-axis-bottom"><span>-50</span><span>cent</span></div>
            <svg className="pitch-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="直近のピッチ軌跡">
              <defs>
                <linearGradient id="trailGradient" x1="0" x2="1">
                  <stop offset="0" stopColor="rgba(111,255,222,.18)" />
                  <stop offset=".55" stopColor="#8fffe4" />
                  <stop offset="1" stopColor="#62dff7" />
                </linearGradient>
                <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <line className="grid-line" x1="0" x2="100" y1="20" y2="20" />
              <line className="target-line" x1="0" x2="100" y1="50" y2="50" />
              <line className="grid-line" x1="0" x2="100" y1="80" y2="80" />
              {pitchPath ? (
                <path className="pitch-trail" d={pitchPath} filter="url(#softGlow)" />
              ) : (
                <path className="pitch-placeholder" d="M0 66 C18 62 24 55 39 57 S64 47 78 51 S92 44 100 48" />
              )}
            </svg>
            <div className="chart-caption">
              <span>{pitchPath ? '直近3秒の入力' : '入力待ち'}</span>
              <span>TIME →</span>
            </div>
          </div>
        </section>

        <section className="metrics-grid">
          <article className="glass-card input-card">
            <div className="metric-heading">
              <span>マイク入力</span>
              <small>{permission === 'granted' ? 'ACTIVE' : 'STANDBY'}</small>
            </div>
            <div className="mic-row">
              <div className={`mic-orb ${isListening ? 'is-live' : ''}`}><MicIcon /></div>
              <div className="input-bars" aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => (
                  <span key={index} className={index < activeBars ? 'is-on' : ''} />
                ))}
              </div>
            </div>
            <div className="voice-state">
              <span className={frame?.isVoiced ? 'voice-dot is-on' : 'voice-dot'} />
              {frame?.isVoiced ? '声を検出しています' : '声を出すと解析が始まります'}
            </div>
          </article>

          <article className={`glass-card deviation-card tone-${deviationTone}`}>
            <div className="metric-heading">
              <span>現在のずれ</span>
              <small>{frame?.detectedHz ? `${frame.detectedHz.toFixed(1)} Hz` : '— Hz'}</small>
            </div>
            <div className="cent-readout" aria-live="polite">
              <strong>{centError === null ? '—' : `${centError >= 0 ? '+' : ''}${Math.round(centError)}`}</strong>
              <span>cent</span>
            </div>
            <p>{deviationText}</p>
            <div className="cent-meter" aria-hidden="true">
              <div className="meter-track" />
              <span className="meter-zero" />
              <span className="meter-needle" style={{ left: `${centPosition}%` }} />
              <div className="meter-labels"><span>-50</span><span>0</span><span>+50</span></div>
            </div>
          </article>
        </section>

        <section className="glass-card hold-card">
          <div className="hold-heading">
            <div>
              <span>キープ進捗</span>
              <strong>{Math.round(holdProgress * 100)}%</strong>
            </div>
            <small>
              {state.holdDurationMs === null
                ? '時間制限なし'
                : `${(hold.eligibleMs / 1000).toFixed(1)} / ${(state.holdDurationMs / 1000).toFixed(1)} sec`}
            </small>
          </div>
          <div className="hold-track" aria-hidden="true">
            <span style={{ width: `${holdProgress * 100}%` }} />
          </div>
          <div className="hold-foot">
            <span>有効フレーム {Math.round(hold.validFrameRatio * 100)}%</span>
            <span>{hold.success ? '着地成功' : `±${settings.toleranceCents} cent をキープ`}</span>
          </div>
        </section>

        {audioError && <p className="error-banner" role="alert">{audioError}</p>}

        <section className="action-dock" aria-label="Training controls">
          <button type="button" className="secondary-action" onClick={session.playReference}>
            <SpeakerIcon />
            基準音
          </button>
          <button type="button" className="primary-action" onClick={handlePrimary}>
            <span className={`record-dot ${isActive ? 'is-active' : ''}`} />
            {primaryLabel}
          </button>
          {settings.mode !== 'free' && (
            <button type="button" className="secondary-action compact" onClick={session.next}>次へ</button>
          )}
        </section>

        <footer className="footnote">
          <span>RETUNE MVP v0.1</span>
          <span>Local audio analysis · no upload</span>
        </footer>
      </div>

      {settingsOpen && (
        <div className="sheet-backdrop" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="トレーニング設定"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-header">
              <div>
                <span className="eyebrow">SESSION CONTROL</span>
                <h2>トレーニング設定</h2>
              </div>
              <button type="button" className="close-button" aria-label="設定を閉じる" onClick={() => setSettingsOpen(false)}>×</button>
            </div>

            <div className="setting-block">
              <div className="setting-title"><span>BPM</span><strong>{settings.bpm}</strong></div>
              <input
                aria-label="BPM"
                type="range"
                min="40"
                max="220"
                step="1"
                value={settings.bpm}
                onChange={(event) => updateSettings({ bpm: Number(event.target.value) })}
              />
            </div>

            <div className="setting-block">
              <div className="setting-title"><span>判定時間</span><small>1音あたり</small></div>
              <div className="segmented-control four">
                {DURATION_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={settings.duration === value}
                    onClick={() => updateSettings({ duration: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-block">
              <div className="setting-title"><span>判定精度</span><small>許容する音程差</small></div>
              <div className="segmented-control">
                {([10, 20, 30] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={settings.toleranceCents === value}
                    onClick={() => updateSettings({ toleranceCents: value })}
                  >
                    ±{value} cent
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-block">
              <div className="setting-title"><span>音域</span><small>RANDOM / SCALE の対象</small></div>
              <div className="range-selects">
                <label>
                  <span>LOW</span>
                  <select value={settings.minMidi} onChange={(event) => updateSettings({ minMidi: Number(event.target.value) })}>
                    {NOTE_OPTIONS.map((midi) => <option key={midi} value={midi}>{midiToNoteName(midi)}</option>)}
                  </select>
                </label>
                <span className="range-divider">→</span>
                <label>
                  <span>HIGH</span>
                  <select value={settings.maxMidi} onChange={(event) => updateSettings({ maxMidi: Number(event.target.value) })}>
                    {NOTE_OPTIONS.map((midi) => <option key={midi} value={midi}>{midiToNoteName(midi)}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {settings.mode === 'free' && (
              <div className="setting-block compact-setting">
                <div className="setting-title"><span>FREE ターゲット</span><small>繰り返す音</small></div>
                <select value={settings.freeMidi} onChange={(event) => updateSettings({ freeMidi: Number(event.target.value) })}>
                  {NOTE_OPTIONS.map((midi) => <option key={midi} value={midi}>{midiToNoteName(midi)}</option>)}
                </select>
              </div>
            )}

            {settings.mode === 'scale' && (
              <div className="setting-block compact-setting">
                <div className="setting-title"><span>SCALE ROOT</span><small>開始音</small></div>
                <div className="inline-settings">
                  <select value={settings.rootMidi} onChange={(event) => updateSettings({ rootMidi: Number(event.target.value) })}>
                    {NOTE_OPTIONS.map((midi) => <option key={midi} value={midi}>{midiToNoteName(midi)}</option>)}
                  </select>
                  <div className="segmented-control tiny">
                    <button type="button" aria-pressed={settings.transposeDirection === 'up'} onClick={() => updateSettings({ transposeDirection: 'up' })}>UP</button>
                    <button type="button" aria-pressed={settings.transposeDirection === 'down'} onClick={() => updateSettings({ transposeDirection: 'down' })}>DOWN</button>
                  </div>
                </div>
              </div>
            )}

            <label className="toggle-row">
              <div>
                <strong>基準音を鳴らし続ける</strong>
                <small>発声中もターゲット音を再生します</small>
              </div>
              <input
                type="checkbox"
                checked={settings.continuousReference}
                onChange={(event) => updateSettings({ continuousReference: event.target.checked })}
              />
              <span className="toggle-ui" aria-hidden="true" />
            </label>

            <div className="sheet-footer">
              <button type="button" className="reset-button" onClick={resetSettings}>初期設定に戻す</button>
              <button type="button" className="save-button" onClick={() => setSettingsOpen(false)}>設定を閉じる</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
