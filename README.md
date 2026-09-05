# RETUNE

RETUNE is a mobile-first pitch landing trainer for practicing the moment a sung note reaches a target pitch and stays stable. The v0.1 app runs entirely in the browser: microphone audio is analyzed locally and is not uploaded to a server.

## Local development

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

The app targets current iPhone Safari first, while remaining usable in modern desktop browsers.

## iPhone / microphone testing

Microphone capture requires a secure context. `localhost` is allowed for development; when testing on an iPhone over the network, use an HTTPS deployment.

On first Start, Safari should ask for microphone access. If access was denied, open Safari's site settings for the page, set **Microphone** to **Allow**, then retry Start. If the page is backgrounded during an active attempt, RETUNE pauses the session and requires an explicit resume.

## Reference tone behavior

**Standard reference mode** is recommended when using the phone speaker. RETUNE plays the target tone, stops it, counts in, and then scores the microphone so the speaker is less likely to contaminate pitch detection.

**Continuous Reference** keeps the target tone playing during the scored interval. It is intended for headphones; browser audio APIs cannot guarantee isolated speaker/microphone routing on every device.

The manual **Reference** control remains usable even when microphone permission is denied, so target pitches can still be checked without enabling capture.

## Training modes

- **FREE** repeats a selected pitch.
- **SCALE** traverses the major scale up and down, then transposes the root by one semitone within the configured range.
- **RANDOM** chooses a non-immediate-duplicate pitch inside the configured range.

Default scoring uses a ±20 cent tolerance and requires at least 80% in-tune eligible time. Low-confidence/low-level frames and the initial voiced onset are excluded from success scoring rather than counted as incorrect.
