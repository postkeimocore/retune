# RETUNE MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build RETUNE v0.1 as a mobile-first PWA that plays target pitches, detects sung pitch with high reliability, scores cent accuracy and stability, and supports FREE, SCALE, and RANDOM training modes with the supplied RETUNE visual direction.

**Architecture:** The app is a client-only React/TypeScript PWA. Audio capture/detection, musical math, scoring, and training state are isolated into focused modules so the detector can be replaced later without rewriting UI or training logic. React renders processed state only; raw audio analysis stays outside the render path.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Web Audio API, `navigator.mediaDevices.getUserMedia()`, Pitchy or equivalent McLeod Pitch Method implementation, vite-plugin-pwa, CSS.

**Spec:** `docs/superpowers/specs/2026-09-06-retune-mvp-design.md`

## Global Constraints

- Primary target is iPhone Safari and installed PWA.
- Production must run in a secure HTTPS context for microphone access.
- No accounts, backend, cloud database, payments, AI coaching, or long-term analytics in v0.1.
- FREE, SCALE, and RANDOM must all be implemented.
- Default pitch tolerance is ±20 cent; presets are ±10, ±20, ±30 cent.
- Default success rule is at least 80% in-tune eligible frames during the required hold duration.
- Low-confidence and low-RMS frames are excluded from scoring rather than treated as wrong notes.
- Approx. 150–250 ms after voiced onset is excluded from success scoring.
- Sudden likely octave jumps should be suppressed using continuity against recent stable pitch.
- Standard reference-tone mode stops target audio before scoring. Continuous-reference mode is explicitly labeled headphone-recommended.
- UI must preserve the supplied RETUNE visual language: near-black background, cyan/teal glow, restrained glass cards, strong note hierarchy, realtime cent meter, pitch-history line, and lower thumb-reach controls.
- A common iPhone viewport should support the core training loop without requiring page navigation.

---

## File Structure

```text
retune/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts
├─ public/
│  ├─ icons/
│  └─ manifest.webmanifest
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ app.css
│  ├─ types.ts
│  ├─ music/
│  │  ├─ notes.ts
│  │  └─ notes.test.ts
│  ├─ scoring/
│  │  ├─ pitchMath.ts
│  │  ├─ pitchMath.test.ts
│  │  ├─ holdScorer.ts
│  │  └─ holdScorer.test.ts
│  ├─ audio/
│  │  ├─ detector.ts
│  │  ├─ detector.test.ts
│  │  ├─ microphone.ts
│  │  └─ referenceTone.ts
│  ├─ training/
│  │  ├─ timing.ts
│  │  ├─ timing.test.ts
│  │  ├─ modes.ts
│  │  ├─ modes.test.ts
│  │  └─ reducer.ts
│  ├─ hooks/
│  │  ├─ usePitchEngine.ts
│  │  └─ useTrainingSession.ts
│  ├─ components/
│  │  ├─ ModeTabs.tsx
│  │  ├─ TunerHero.tsx
│  │  ├─ CentMeter.tsx
│  │  ├─ PitchHistory.tsx
│  │  ├─ HoldProgress.tsx
│  │  ├─ PrimaryControls.tsx
│  │  ├─ SettingsSheet.tsx
│  │  └─ PermissionNotice.tsx
│  └─ storage/
│     ├─ settings.ts
│     └─ settings.test.ts
└─ docs/superpowers/
```

---

### Task 1: Scaffold the PWA and Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/app.css`
- Create: `src/types.ts`
- Create: `src/App.test.tsx`
- Create: `public/manifest.webmanifest`

**Interfaces:**
- Consumes: none.
- Produces: a bootable React/Vite app, Vitest setup, shared `PitchFrame`, `TrainingState`, `TrainingMode`, `ToleranceCents`, and `SessionPhase` types.

- [ ] **Step 1: Add package scripts and dependencies**

Use scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

Runtime dependencies: `react`, `react-dom`, `pitchy`. Dev dependencies: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/react`, `@types/react-dom`.

- [ ] **Step 2: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the RETUNE shell', () => {
    render(<App />);
    expect(screen.getByText('RETUNE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FREE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SCALE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RANDOM' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test and verify failure**

Run: `npm test -- src/App.test.tsx`

Expected: failure because the app shell and test setup do not yet exist.

- [ ] **Step 4: Implement minimal shell and shared types**

`src/types.ts` must contain:

```ts
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
```

Implement `App.tsx` with a visible `RETUNE` title and the three mode buttons only. Configure Vite, React, Vitest/jsdom, and PWA manifest.

- [ ] **Step 5: Run smoke test and build**

Run: `npm test -- src/App.test.tsx && npm run build`

Expected: PASS and successful production build.

- [ ] **Step 6: Commit**

```bash
git add package.json index.html tsconfig.json vite.config.ts vitest.config.ts public src

git commit -m "chore: scaffold RETUNE PWA"
```

---

### Task 2: Musical Note and Pitch Math Core

**Files:**
- Create: `src/music/notes.ts`
- Create: `src/music/notes.test.ts`
- Create: `src/scoring/pitchMath.ts`
- Create: `src/scoring/pitchMath.test.ts`

**Interfaces:**
- Consumes: shared types only.
- Produces:
  - `noteNameToMidi(note: string): number`
  - `midiToNoteName(midi: number): string`
  - `midiToFrequency(midi: number, a4?: number): number`
  - `noteToFrequency(note: string, a4?: number): number`
  - `frequencyToMidi(frequency: number, a4?: number): number`
  - `frequencyToCents(detectedHz: number, targetHz: number): number`
  - `frequencyToNearestNote(frequency: number): { note: string; midi: number; cents: number }`

- [ ] **Step 1: Write failing musical math tests**

```ts
import { describe, expect, it } from 'vitest';
import { noteNameToMidi, midiToFrequency, midiToNoteName } from './notes';

it('maps A4 to MIDI 69 and 440 Hz', () => {
  expect(noteNameToMidi('A4')).toBe(69);
  expect(midiToFrequency(69)).toBeCloseTo(440, 5);
});

it('maps middle C correctly', () => {
  expect(noteNameToMidi('C4')).toBe(60);
  expect(midiToNoteName(60)).toBe('C4');
  expect(midiToFrequency(60)).toBeCloseTo(261.6256, 3);
});
```

And:

```ts
import { describe, expect, it } from 'vitest';
import { frequencyToCents } from './pitchMath';

it('returns zero cents for the target frequency', () => {
  expect(frequencyToCents(440, 440)).toBeCloseTo(0, 6);
});

it('returns +100 cents one equal-tempered semitone above', () => {
  expect(frequencyToCents(466.1637615, 440)).toBeCloseTo(100, 2);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/music/notes.test.ts src/scoring/pitchMath.test.ts`

Expected: module-not-found/function-not-defined failures.

- [ ] **Step 3: Implement note parsing and equal-temperament conversions**

Use sharp canonical note names:

```ts
const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
```

Formula:

```ts
export const midiToFrequency = (midi: number, a4 = 440) =>
  a4 * Math.pow(2, (midi - 69) / 12);
```

- [ ] **Step 4: Implement cent conversion and nearest-note helper**

```ts
export const frequencyToCents = (detectedHz: number, targetHz: number) =>
  1200 * Math.log2(detectedHz / targetHz);
```

Nearest MIDI:

```ts
const midiFloat = 69 + 12 * Math.log2(frequency / 440);
const midi = Math.round(midiFloat);
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/music/notes.test.ts src/scoring/pitchMath.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/music src/scoring/pitchMath*
git commit -m "feat: add musical pitch math"
```

---

### Task 3: Build Hold Scoring and Stability Rules

**Files:**
- Create: `src/scoring/holdScorer.ts`
- Create: `src/scoring/holdScorer.test.ts`

**Interfaces:**
- Consumes: `PitchFrame`, `ToleranceCents`.
- Produces:
  - `createHoldScorer(config: HoldScorerConfig): HoldScorer`
  - `push(frame: PitchFrame): HoldScoreSnapshot`
  - `reset(): void`
  - `HoldScoreSnapshot { eligibleMs, inTuneMs, validFrameRatio, progress, success }`

- [ ] **Step 1: Write failing scoring tests**

Tests must cover 80% threshold, excluded low-confidence frames, onset grace, and short-gap behavior.

```ts
it('clears when at least 80 percent of eligible time is in tune', () => {
  const scorer = createHoldScorer({
    requiredMs: 1000,
    toleranceCents: 20,
    minConfidence: 0.9,
    minRms: 0.01,
    onsetGraceMs: 200,
    maxGapMs: 180,
  });

  for (let t = 0; t <= 1200; t += 50) {
    scorer.push(frame(t, t < 200 ? 30 : 5, 0.98, 0.08));
  }

  expect(scorer.snapshot().success).toBe(true);
});
```

Add a test where confidence is `0.3`; verify it does not lower `validFrameRatio` as a wrong note, and a test where >20% of eligible voiced duration is outside tolerance; verify failure.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/scoring/holdScorer.test.ts`

Expected: missing module/function failures.

- [ ] **Step 3: Implement time-weighted scoring**

Score by timestamp deltas between accepted voiced frames, not by frame count. Frames below `minConfidence` or `minRms` are ignored for correctness. A gap longer than `maxGapMs` resets the active hold segment. Ignore the first `onsetGraceMs` of each new voiced segment.

- [ ] **Step 4: Run scorer tests**

Run: `npm test -- src/scoring/holdScorer.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scoring/holdScorer*
git commit -m "feat: add stable hold scoring"
```

---

### Task 4: Implement Timing and Training Mode Generators

**Files:**
- Create: `src/training/timing.ts`
- Create: `src/training/timing.test.ts`
- Create: `src/training/modes.ts`
- Create: `src/training/modes.test.ts`
- Create: `src/training/reducer.ts`

**Interfaces:**
- Consumes: note/MIDI utilities and shared types.
- Produces:
  - `beatDurationMs(bpm: number): number`
  - `evaluationDurationMs(kind: 'beat' | 'bar' | 'twoBars' | 'unlimited', bpm: number): number | null`
  - `buildScaleSequence(rootMidi: number): number[]`
  - `transposeRoot(rootMidi: number, direction: 'up' | 'down'): number`
  - `pickRandomMidi(minMidi: number, maxMidi: number, previousMidi?: number): number`
  - reducer events for `START_REFERENCE`, `BEGIN_COUNT_IN`, `BEGIN_LISTENING`, `CLEAR`, `NEXT_TARGET`, `PAUSE`, `RESUME`, `STOP`.

- [ ] **Step 1: Write failing timing tests**

```ts
it('calculates 120 BPM durations', () => {
  expect(beatDurationMs(120)).toBe(500);
  expect(evaluationDurationMs('bar', 120)).toBe(2000);
  expect(evaluationDurationMs('twoBars', 120)).toBe(4000);
});
```

- [ ] **Step 2: Write failing mode tests**

Scale intervals must be `[0,2,4,5,7,9,11,12,11,9,7,5,4,2,0]` relative to root.

```ts
expect(buildScaleSequence(60)).toEqual([
  60, 62, 64, 65, 67, 69, 71, 72,
  71, 69, 67, 65, 64, 62, 60,
]);
```

Random mode must always return an integer in `[minMidi,maxMidi]` and avoid `previousMidi` when more than one candidate exists.

- [ ] **Step 3: Run and verify failure**

Run: `npm test -- src/training/timing.test.ts src/training/modes.test.ts`

- [ ] **Step 4: Implement timing/modes/reducer**

Clamp BPM to `40..200`. SCALE transposes the root by one semitone after a completed ascent/descent cycle. RANDOM operates on the configured MIDI range. FREE uses the selected MIDI note without auto-changing it.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/training/timing.test.ts src/training/modes.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/training
git commit -m "feat: add training mode engine"
```

---

### Task 5: Implement Microphone, Reference Tone, and Pitch Detector

**Files:**
- Create: `src/audio/microphone.ts`
- Create: `src/audio/referenceTone.ts`
- Create: `src/audio/detector.ts`
- Create: `src/audio/detector.test.ts`

**Interfaces:**
- Consumes: Pitchy, note/pitch math.
- Produces:
  - `requestMicrophone(): Promise<MediaStream>`
  - `stopMicrophone(stream: MediaStream): void`
  - `createReferenceTone(context: AudioContext): ReferenceToneController`
  - `createPitchDetector(sampleRate: number, options?: DetectorOptions): PitchDetectorEngine`
  - `analyse(samples: Float32Array, timestamp: number): DetectorFrame`

`DetectorFrame`:

```ts
export interface DetectorFrame {
  timestamp: number;
  frequency: number | null;
  confidence: number;
  rms: number;
  isVoiced: boolean;
}
```

- [ ] **Step 1: Write generated-sine detector tests**

Generate a buffer using:

```ts
const sine = (frequency: number, sampleRate = 48000, length = 4096) =>
  Float32Array.from({ length }, (_, i) => Math.sin((2 * Math.PI * frequency * i) / sampleRate));
```

Tests:

```ts
it.each([
  [220, 'A3'],
  [261.6256, 'C4'],
  [329.6276, 'E4'],
  [440, 'A4'],
])('detects %s Hz', (hz) => {
  const detector = createPitchDetector(48000);
  const result = detector.analyse(sine(hz), 0);
  expect(result.frequency).not.toBeNull();
  expect(result.frequency!).toBeCloseTo(hz, 1);
  expect(result.isVoiced).toBe(true);
});
```

Also test silence: all-zero samples must produce `frequency: null`, `isVoiced: false`.

- [ ] **Step 2: Run detector tests and verify failure**

Run: `npm test -- src/audio/detector.test.ts`

- [ ] **Step 3: Implement RMS and Pitchy McLeod detector wrapper**

Use a detector buffer size of 4096 initially. Compute RMS before calling pitch estimation. Reject below default RMS `0.008`. Keep thresholds configurable.

- [ ] **Step 4: Add median smoothing and octave continuity guard**

Maintain the last five valid frequencies. Use the median for scoring/display output. For a new candidate near 2× or 0.5× the recent stable frequency, prefer the octave-adjusted candidate closest to the stable value when detector confidence remains strong.

- [ ] **Step 5: Implement microphone and reference tone controllers**

`requestMicrophone()` must request mono audio with browser processing disabled where supported:

```ts
{
  audio: {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  }
}
```

`ReferenceToneController` must expose `play(frequency: number, gain?: number)`, `stop()`, and `dispose()`. Use a sine oscillator with a short gain ramp to avoid clicks.

- [ ] **Step 6: Run audio tests**

Run: `npm test -- src/audio/detector.test.ts`

Expected: PASS for 220, 261.63, 329.63, 440 Hz and silence rejection.

- [ ] **Step 7: Commit**

```bash
git add src/audio
git commit -m "feat: add realtime pitch audio engine"
```

---

### Task 6: Integrate Audio and Training Session Hooks

**Files:**
- Create: `src/hooks/usePitchEngine.ts`
- Create: `src/hooks/useTrainingSession.ts`
- Create: `src/hooks/useTrainingSession.test.tsx`
- Create: `src/storage/settings.ts`
- Create: `src/storage/settings.test.ts`

**Interfaces:**
- Consumes: detector, microphone, reference tone, scorer, training modes/timing.
- Produces:
  - `usePitchEngine({ targetNote, targetHz, toleranceCents })`
  - `useTrainingSession()` with state, current frame/history, control methods, and settings.
  - persisted `RetuneSettings`.

- [ ] **Step 1: Write settings persistence tests**

Default settings:

```ts
{
  mode: 'free',
  bpm: 100,
  duration: 'bar',
  toleranceCents: 20,
  minMidi: 48,
  maxMidi: 72,
  rootMidi: 60,
  freeMidi: 60,
  transposeDirection: 'up',
  continuousReference: false,
}
```

Verify invalid stored JSON falls back to defaults.

- [ ] **Step 2: Write session transition test**

Use fake timers. Verify a standard-mode `start()` sequence advances:

```text
idle → referencePlaying → countIn → listening
```

and `onSuccess()` advances the SCALE target to the next sequence note, while FREE keeps its selected target and RANDOM changes to a non-duplicate valid target.

- [ ] **Step 3: Run tests and verify failure**

Run: `npm test -- src/storage/settings.test.ts src/hooks/useTrainingSession.test.tsx`

- [ ] **Step 4: Implement settings loader/saver**

Use one key: `retune:v0.1:settings`. Validate numeric ranges before accepting stored values.

- [ ] **Step 5: Implement `usePitchEngine`**

Create/resume `AudioContext` only after a user gesture. Connect microphone to `AnalyserNode`, capture 4096-sample time-domain windows, call detector in `requestAnimationFrame`, and publish processed frames at approximately 20–30 updates/second. Retain only the latest ~3 seconds of pitch history in memory.

- [ ] **Step 6: Implement `useTrainingSession` state machine**

Standard mode: target tone `700 ms` → stop → count-in `1 beat` → score.

Continuous mode: play tone through listening/evaluation and label it headphone-recommended in UI.

On `visibilitychange` to hidden: pause training and stop reference tone. Require explicit resume.

- [ ] **Step 7: Run integration unit tests**

Run: `npm test -- src/storage/settings.test.ts src/hooks/useTrainingSession.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/hooks src/storage
git commit -m "feat: integrate RETUNE training session"
```

---

### Task 7: Build the RETUNE Training UI

**Files:**
- Create: `src/components/ModeTabs.tsx`
- Create: `src/components/TunerHero.tsx`
- Create: `src/components/CentMeter.tsx`
- Create: `src/components/PitchHistory.tsx`
- Create: `src/components/HoldProgress.tsx`
- Create: `src/components/PrimaryControls.tsx`
- Create: `src/components/SettingsSheet.tsx`
- Create: `src/components/PermissionNotice.tsx`
- Modify: `src/App.tsx`
- Modify: `src/app.css`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useTrainingSession()` and `PitchFrame[]` history.
- Produces: complete single-screen mobile training workflow.

- [ ] **Step 1: Extend UI test with primary information hierarchy**

Verify the main screen exposes:

```tsx
expect(screen.getByTestId('target-note')).toBeInTheDocument();
expect(screen.getByTestId('cent-meter')).toBeInTheDocument();
expect(screen.getByTestId('hold-progress')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /reference/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run test and verify failure**

Run: `npm test -- src/App.test.tsx`

- [ ] **Step 3: Implement component structure**

The vertical hierarchy must be:

```text
RETUNE header + settings
FREE / SCALE / RANDOM tabs
Target note + target Hz
Detected note + signed cent status
Cent meter
3-second pitch-history line
Hold progress / remaining time
Reference + Start/Pause/Retry/Next controls
```

The settings sheet contains BPM, duration, tolerance, pitch range, root/free target, transposition direction, and continuous-reference toggle.

- [ ] **Step 4: Implement visual system**

CSS design tokens:

```css
:root {
  --bg: #050708;
  --surface: rgba(17, 26, 28, 0.62);
  --surface-strong: rgba(22, 34, 36, 0.82);
  --line: rgba(147, 255, 239, 0.16);
  --text: #f5fbfa;
  --muted: #78908d;
  --accent: #7ef6e2;
  --accent-2: #55aef7;
  --danger: #ff6f7d;
  --radius-lg: 24px;
  --radius-md: 16px;
}
```

Use glow selectively on target-note, zero-cent state, active progress, and CLEAR. Keep body background dark with subtle radial gradients; glass panels use blur and translucent borders. Do not make every control glow.

- [ ] **Step 5: Implement the cent meter**

Range shown: `-50..+50 cent`. Clamp the visual marker to the edge for larger errors while displaying the real signed cent value numerically. The centered zone uses the configured tolerance visually.

- [ ] **Step 6: Implement pitch-history line without a chart dependency**

Render an SVG polyline from recent frames. X = timestamp over latest 3 seconds. Y = clamped cent error from `-50..+50`. Break the line across null/unvoiced frames.

- [ ] **Step 7: Implement mobile ergonomics**

Use `min-height: 100dvh`, safe-area padding via `env(safe-area-inset-*)`, and sticky/lower controls so primary actions remain in thumb reach. The main workflow must not require another route.

- [ ] **Step 8: Run UI tests and build**

Run: `npm test -- src/App.test.tsx && npm run build`

Expected: PASS and production build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components src/App.tsx src/App.test.tsx src/app.css
git commit -m "feat: build RETUNE mobile tuner UI"
```

---

### Task 8: Permission, iOS, PWA, and Recovery Behavior

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/usePitchEngine.ts`
- Modify: `src/hooks/useTrainingSession.ts`
- Modify: `public/manifest.webmanifest`
- Create: `src/components/PermissionNotice.test.tsx`
- Create: `README.md`

**Interfaces:**
- Consumes: app/session/audio hooks.
- Produces: robust microphone permission states and documented iPhone usage.

- [ ] **Step 1: Write permission-state test**

Verify denied/unavailable microphone renders an actionable in-context notice and leaves reference playback usable.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/components/PermissionNotice.test.tsx`

- [ ] **Step 3: Implement browser recovery handling**

Map `NotAllowedError` to `microphonePermissionRequired`. Map `NotFoundError` to `microphoneUnavailable`. If `AudioContext.state === 'suspended'`, resume only from explicit Start/Reference user gestures.

- [ ] **Step 4: Finalize PWA manifest**

Manifest must use:

```json
{
  "name": "RETUNE",
  "short_name": "RETUNE",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "background_color": "#050708",
  "theme_color": "#050708",
  "orientation": "portrait"
}
```

Add maskable/app icons before production deployment.

- [ ] **Step 5: Document local and iPhone test flow**

README must include exact commands:

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

Also document: microphone requires HTTPS outside localhost; Standard reference mode is recommended for phone speakers; Continuous Reference is intended for headphones.

- [ ] **Step 6: Run tests/build**

Run: `npm test && npm run build`

Expected: all tests PASS and build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src public README.md
git commit -m "feat: harden RETUNE PWA for iPhone"
```

---

### Task 9: Calibration Pass and Deployment Readiness

**Files:**
- Modify as indicated by measured results: `src/audio/detector.ts`, `src/scoring/holdScorer.ts`, `src/app.css`
- Create: `docs/manual-test-checklist.md`

**Interfaces:**
- Consumes: complete application.
- Produces: verified detector thresholds and deployment-ready main branch.

- [ ] **Step 1: Run the automated verification suite**

Run:

```bash
npm ci
npm test
npm run build
```

Expected: zero failing tests and a successful Vite build.

- [ ] **Step 2: Complete desktop microphone smoke test**

Verify sustained `A3`, `C4`, `E4`, `A4` against an external reliable tone source or instrument tuner. Record whether the displayed pitch is stable, whether octave jumps occur, and approximate latency.

- [ ] **Step 3: Complete iPhone Safari manual test**

Verify all of:

```text
[ ] microphone permission works
[ ] Start resumes AudioContext after a user gesture
[ ] sustained vowel produces stable note/cent feedback
[ ] Standard reference tone stops before scoring
[ ] continuous-reference mode works with headphones
[ ] FREE can clear at ±20 cent
[ ] SCALE traverses up/down then transposes one semitone
[ ] RANDOM stays inside configured range and avoids immediate duplicate
[ ] backgrounding pauses the session
[ ] layout fits common iPhone portrait viewport without broken controls
[ ] Add to Home Screen / standalone PWA works
```

- [ ] **Step 4: Calibrate only with measured evidence**

If voiced vowels are frequently rejected, adjust `minRms` or `minConfidence` and rerun generated-sine tests plus device checks. If octave errors occur, tighten continuity logic and add the reproducing case to `detector.test.ts` before changing implementation. Do not loosen scoring simply to make CLEAR easier.

- [ ] **Step 5: Create manual test checklist with recorded values**

`docs/manual-test-checklist.md` must record device/browser, detector buffer size, RMS threshold, confidence threshold, onset grace, max voiced gap, tolerance, and measured observations.

- [ ] **Step 6: Final verification**

Run again:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit calibration**

```bash
git add src docs/manual-test-checklist.md
git commit -m "test: calibrate RETUNE pitch detection"
```

---

## Deployment

Use Cloudflare Pages after Task 9 verification.

Cloudflare Pages settings:

```text
Repository: postkeimocore/retune
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

No server runtime or environment secrets are required for v0.1.

## Plan Self-Review

- Spec coverage: FREE/SCALE/RANDOM, realtime pitch, cent math, confidence/RMS gating, onset exclusion, octave continuity, hold scoring, BPM/durations, reference-tone behaviors, local settings, PWA, iPhone recovery, UI hierarchy, future-compatible frame data, unit/audio/manual tests, and deployment are all assigned to explicit tasks.
- Placeholder scan: no TBD/TODO/"implement later" steps remain.
- Type consistency: `PitchFrame`, `TrainingState`, `TrainingMode`, `ToleranceCents`, detector output, scoring input, and training mode outputs use the same names across tasks.
- Scope: backend, authentication, analytics dashboards, AI coaching, and payments remain explicitly outside v0.1.
