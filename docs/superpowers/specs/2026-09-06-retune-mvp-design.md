# RETUNE MVP Design Spec

## 1. Purpose

RETUNE v0.1 is a mobile-first PWA for vocal pitch rehabilitation and tuning practice. Its primary goal is not broad vocal diagnosis; it is to let a singer hear a target pitch, reproduce it with their voice, and verify in real time whether the produced pitch is accurately centered and stable.

The product must prioritize trustworthy pitch detection and a usable training loop over secondary features. UI simplification must not reduce clarity, feedback quality, or the visual identity established in the supplied RETUNE concept screens.

## 2. MVP Scope

### Included

- FREE mode: choose a target note and hold it until the success condition is met.
- SCALE mode: ascending and descending diatonic scale, then automatic semitone transposition up or down.
- RANDOM mode: choose random target notes inside a configured range.
- Target-tone playback using Web Audio API.
- Microphone capture using `getUserMedia()`.
- Real-time pitch estimation.
- Cent-error display relative to the target.
- Confidence / voice-validity filtering.
- Hold-duration scoring.
- BPM control and beat/bar based evaluation duration.
- Adjustable tolerance presets: ±10, ±20, ±30 cent.
- Configurable pitch range.
- Headphone-continuous-reference option.
- PWA installability and iPhone Safari support.
- Local persistence of user settings.
- Session-frame data model prepared for future analysis.

### Explicitly excluded from v0.1

- Accounts and authentication.
- Cloud database.
- Cross-device sync.
- Long-term analytics dashboards.
- AI coaching or diagnosis.
- Subscription/payment.
- Social/sharing features.
- Advanced vocal-trait analysis such as onset tendency, previous-note carryover, or technique classification.

## 3. Product Principles

1. **Accuracy first.** The tuning result must feel reliable enough to train against.
2. **Immediate legibility.** The user must understand the target note, current deviation, and remaining hold time at a glance.
3. **Low interaction cost.** Major controls should be reachable with one hand on iPhone.
4. **Visual continuity with RETUNE.** The supplied concept screens define the design language; MVP means fewer features, not a generic or stripped-down interface.
5. **Future-compatible data.** The realtime engine should emit structured data that can later support deeper analysis without rewriting the audio core.

## 4. Technical Architecture

### Frontend

- React
- TypeScript
- Vite
- PWA support via `vite-plugin-pwa`

### Audio

- Web Audio API
- `navigator.mediaDevices.getUserMedia()`
- Pitch detection based on a McLeod Pitch Method implementation, preferably through a small maintained library such as Pitchy if it performs reliably on iOS Safari.
- OscillatorNode for target-tone generation.

### Persistence

- `localStorage` for user preferences only.

### Hosting

- Cloudflare Pages connected to the GitHub `main` branch.
- Production must be served over HTTPS because microphone access requires a secure context.

## 5. Core Data Model

Every accepted analysis frame should be representable as:

```ts
interface PitchFrame {
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
```

Session state should separately track:

```ts
interface TrainingState {
  mode: 'free' | 'scale' | 'random';
  targetNote: string;
  targetHz: number;
  bpm: number;
  holdDurationMs: number | null;
  toleranceCents: 10 | 20 | 30;
  validFrameRatio: number;
  elapsedMs: number;
  success: boolean;
}
```

## 6. Pitch Detection and Scoring

### Frequency-to-cent conversion

For detected frequency `f` and target frequency `target`:

```text
cent = 1200 × log2(f / target)
```

### Detection pipeline

1. Capture microphone input.
2. Compute signal loudness (RMS).
3. Reject frames below a voice-activity threshold.
4. Estimate fundamental frequency.
5. Reject frames below a minimum pitch-confidence threshold.
6. Apply short-window median smoothing to reduce jitter.
7. Apply continuity checks to reduce octave jumps.
8. Compute cent error against target.
9. Emit the realtime display value.
10. Feed accepted frames into hold scoring.

### Accuracy safeguards

- Initial onset exclusion: approximately 150–250 ms after voiced onset is detected should not count toward success scoring.
- Low-confidence pitch frames should not be treated as wrong notes; they should be excluded from scoring.
- Very low RMS frames should be excluded as silence/breath/noise.
- Octave-jump suppression should prefer continuity with the recent stable pitch when the algorithm produces a sudden near-2× or 0.5× jump.
- The raw detector should remain independently replaceable so a future CREPE-like model can be tested without rewriting the training engine.

### Display versus scoring

The UI should update quickly enough to feel realtime, while scoring may use a slightly more stable smoothed value. The user should not wait for the display, but the CLEAR decision should not flicker because of single-frame noise.

### Hold success

Default success rule:

- At least 80% of eligible frames during the required hold duration must fall within the configured tolerance.
- Frames rejected for silence or low confidence do not count as correct.
- A prolonged gap in voiced input pauses or resets hold progress depending on duration; a short gap should not immediately fail the attempt.

Default tolerance: ±20 cent.

Presets:

- Precision: ±10 cent
- Standard: ±20 cent
- Relaxed: ±30 cent

## 7. Training Modes

### FREE

- User chooses a note.
- Target tone can be played manually or automatically.
- User begins singing after the reference tone.
- The app evaluates until the required hold duration is achieved.
- Optional unlimited mode continues indefinitely without auto-advance.

### SCALE

Default sequence:

```text
C D E F G A B C
C B A G F E D C
```

The sequence is relative to the selected root and octave range, not hardcoded to C only.

After one completed ascent/descent cycle:

- transpose root +1 semitone when direction is up,
- transpose root -1 semitone when direction is down.

The user can configure lower and upper pitch boundaries to avoid exceeding a safe or useful vocal range.

### RANDOM

- Select a note randomly from the configured range.
- Play the target tone.
- Stop the reference tone unless headphone-continuous mode is enabled.
- Listen for the user's pitch.
- CLEAR when hold criteria are satisfied.
- Advance to the next random note.
- Avoid immediate duplicate notes where practical.

## 8. Timing and BPM

BPM controls the pacing of count-in and beat/bar durations.

In 4/4:

```text
1 beat = 60 / BPM seconds
1 bar = 4 × beat duration
2 bars = 8 × beat duration
```

Evaluation duration options:

- 1 beat
- 1 bar
- 2 bars
- until matched / unlimited

A short count-in should be available before microphone scoring begins.

## 9. Reference Tone and Speaker/Headphone Behavior

Two behaviors are required.

### Standard mode

1. Play target tone.
2. Stop tone.
3. Count in.
4. Start pitch scoring.

This is the default because it avoids the iPhone speaker being captured by the microphone.

### Continuous reference mode

- Target tone continues while the user sings.
- Label clearly as headphone-recommended.
- The app should not promise perfect output-device routing from the browser.

## 10. UI / UX Design

The supplied RETUNE concept images are the visual reference. The implementation should preserve their visual language rather than reduce the interface to a utility-style tuner.

### Visual language

- Deep black / near-black background.
- Cyan-to-teal luminous accents.
- Subtle glow around active pitch and success states.
- Semi-transparent glass-like cards and controls.
- Thin waveform / graph strokes.
- High-contrast typography.
- Large musical note and cent feedback as the primary focal point.
- Controlled use of gradients and blur; decorative effects must not reduce readability.

### Information hierarchy

The default training screen should answer three questions immediately:

1. **What should I sing?** — target note, octave, target frequency.
2. **Where am I now?** — detected note/frequency and signed cent offset.
3. **How close am I to clearing?** — hold progress / remaining time.

### Screen structure

#### Header

- RETUNE wordmark/title.
- Compact settings access.

#### Mode switcher

- FREE
- SCALE
- RANDOM

The active mode should remain obvious without opening a menu.

#### Primary tuning region

- Large target note.
- Target Hz.
- Realtime cent meter centered on 0.
- Current detected note / Hz.
- Human-readable feedback such as `LOW`, `CENTERED`, `HIGH` or equivalent Japanese copy.
- Realtime pitch history line for the most recent few seconds.

#### Hold/progress region

- Progress bar or circular/linear hold indicator.
- Remaining time or success ratio.
- CLEAR state should be visually distinct but not disruptive.

#### Main controls

- Play reference.
- Start / pause / stop.
- Retry.
- Next where relevant.

Primary controls should sit inside the lower thumb-reach area on iPhone.

#### Settings drawer/sheet

- BPM.
- Hold duration.
- Tolerance.
- Pitch range.
- Scale transposition direction.
- Continuous-reference toggle.

These settings should not dominate the main screen during training.

### Interaction requirements

- The user should not need to navigate between multiple pages to switch basic training modes.
- A full training loop should be possible without scrolling on common iPhone screen sizes where feasible.
- State changes—listening, reference playing, detected, centered, clear—must have distinct visual feedback.
- If microphone permission is missing, the app must explain the required action in-context.

## 11. State Machine

Core training flow:

```text
idle
→ referencePlaying
→ countIn
→ listening
→ evaluating
→ success
→ nextTarget / idle
```

Additional recoverable states:

```text
microphonePermissionRequired
microphoneUnavailable
noVoiceDetected
lowConfidence
paused
```

UI behavior should derive from state rather than scattered local flags.

## 12. Error Handling

- Microphone permission denied: show a persistent actionable message and keep reference playback usable.
- No microphone device: disable scoring and explain why.
- AudioContext suspended by iOS autoplay restrictions: resume from an explicit user gesture.
- Detector cannot produce a confident pitch: show `Listening…` or equivalent rather than displaying a misleading note.
- Out-of-range detected pitch: show current detected pitch but do not count it as correct.
- Page backgrounded: pause active training and require explicit resume.

## 13. Testing Strategy

### Unit tests

- MIDI/note/frequency conversion.
- Frequency-to-cent conversion.
- Scale generation and semitone transposition.
- Random-note selection constraints.
- Hold-scoring thresholds.
- Short-gap and low-confidence behavior.
- Octave-jump guard logic.
- Timing calculations from BPM.

### Audio logic tests

Use generated sine waves for known frequencies to validate detector behavior for representative vocal notes. Include at minimum:

- A3 = 220 Hz
- A4 = 440 Hz
- C4 ≈ 261.63 Hz
- E4 ≈ 329.63 Hz

Test small cent offsets around a target and verify error sign/magnitude.

### Manual device tests

Primary target: iPhone Safari / installed PWA.

Verify:

- Microphone permission flow.
- Realtime latency.
- Stable pitch readout on sustained vowel.
- Speaker reference then microphone scoring.
- Headphone continuous-reference behavior.
- Screen layout without unintended scrolling.
- Pause/resume after backgrounding.

## 14. Performance Targets

- Realtime feedback should feel continuous, targeting roughly 20–30 UI updates per second while detector internals may run at a different cadence.
- Avoid unnecessary React re-renders for every raw audio sample.
- Audio analysis should run outside normal render logic and publish only processed state.
- The app should remain responsive on recent iPhones without a backend.

## 15. Future Extension Compatibility

The audio engine and frame data should support later additions such as:

- pitch-entry delay,
- overshoot / undershoot tendency,
- ascending-versus-descending accuracy,
- range-dependent stability,
- previous-note carryover,
- session history,
- long-term progress visualization,
- more advanced pitch estimators.

These are not v0.1 deliverables.

## 16. Definition of Done for v0.1

RETUNE v0.1 is complete when a user can install/open the PWA on iPhone, grant microphone access, select FREE/SCALE/RANDOM, hear target tones, sing into the microphone, receive stable realtime cent feedback, satisfy a configurable hold criterion, and advance through the training flow with a UI that remains recognizably consistent with the supplied RETUNE visual direction.
