# RETUNE v0.1 Manual Calibration Checklist

This checklist separates automated verification from measurements that require a real microphone, speaker/headphones, and iPhone Safari. Do not tune detector/scoring thresholds without recording a reproducible observation here first.

## Baseline configuration

| Parameter | Current value |
| --- | ---: |
| Pitch detector buffer | 4096 samples |
| Publish cadence | ~30 Hz (33 ms minimum interval) |
| RMS threshold | 0.008 |
| Confidence threshold | 0.78 |
| Voiced onset grace | 200 ms |
| Maximum voiced gap | 180 ms |
| Default pitch tolerance | ±20 cent |
| Success requirement | ≥80% in-tune eligible time |
| Pitch history retained | ~3 seconds |

## Automated verification

- [x] Generated sine-wave detector coverage includes A3 / A4 and representative C/E pitches.
- [x] Silence rejection is covered by automated detector tests.
- [x] Octave-continuity behavior is covered by automated detector tests.
- [x] Hold scoring covers tolerance, confidence/RMS exclusion, onset grace, and voiced gaps.
- [x] FREE / SCALE / RANDOM target-generation behavior is covered by unit/integration tests.
- [x] Settings persistence is covered by tests.
- [x] Production TypeScript/Vite build succeeds in GitHub Actions.
- [x] CI uses the committed lockfile with `npm ci` for reproducible dependency installation.

## Desktop microphone smoke test — pending physical device

Device / OS: _pending_

Browser / version: _pending_

External reference source / tuner: _pending_

| Target | Expected | Observed stable note | Typical cent range | Octave jump? | Approx. response latency | Result |
| --- | --- | --- | --- | --- | --- | --- |
| A3 | 220.00 Hz | — | — | — | — | pending |
| C4 | 261.63 Hz | — | — | — | — | pending |
| E4 | 329.63 Hz | — | — | — | — | pending |
| A4 | 440.00 Hz | — | — | — | — | pending |

Notes: _pending_

## iPhone Safari test — pending physical device

Device: _pending_

iOS: _pending_

Safari: _pending_

Deployment URL: _pending_

- [ ] Microphone permission prompt appears and permission can be granted.
- [ ] Denied permission shows recovery guidance instead of starting a false training session.
- [ ] Manual reference tone remains usable without microphone permission.
- [ ] Start/resume restores a suspended AudioContext after an explicit user gesture.
- [ ] Sustained vowel produces a stable note / Hz / signed-cent response.
- [ ] Standard reference tone stops before microphone scoring begins.
- [ ] Continuous-reference mode works with headphones.
- [ ] FREE can clear with a stable pitch inside ±20 cent.
- [ ] SCALE traverses the major scale up/down and transposes the root one semitone within range.
- [ ] RANDOM stays inside configured range and avoids an immediate duplicate.
- [ ] Backgrounding pauses the active session and explicit resume is required.
- [ ] Core training controls remain usable in a common iPhone portrait viewport.
- [ ] Add to Home Screen installs RETUNE with its app icon and launches standalone.

## Calibration rule

If real-device testing reveals a problem, record the exact device, target pitch, observed behavior, and reproduction steps above. Add a failing automated test where practical before changing `minRms`, `minConfidence`, onset grace, voiced-gap behavior, octave continuity, or success tolerance. Do not loosen scoring merely to make CLEAR easier.
