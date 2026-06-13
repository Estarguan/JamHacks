# Sixth Sense — Audio Spike Trigger (headless)

Privacy-first, **local** audio-spike detection for the Sixth Sense MVP.
No UI — just the trigger engine.

- ❌ No recording, no storing, no uploading audio.
- ❌ No AI for detection.
- ✅ Loudness-only (RMS → relative dBFS).
- ✅ Slowly-adapting baseline (a loud party, a TV, or a quiet room each get
  their own "normal"); baseline is **frozen** during spikes.
- ✅ Fires `onTrigger` on a **sudden, sustained, loud-enough** spike, debounced
  by a cooldown.

## Files (all essential)

| File | What it is |
| --- | --- |
| `audioTriggerEngine.js` | The engine + all pure DSP helpers. The only file with logic. |
| `index.js` | Minimal re-export / import entry point. No UI. |
| `README.md` | This file. |

## API

```js
import { AudioTriggerEngine } from "./backend/index.js";

const engine = new AudioTriggerEngine({
  sensitivityPreset: "low",            // "high" | "medium" | "low" (default: low)
  onTrigger: (event) => {
    console.log("Trigger detected:", event);
    // event = { time, spikeAmountDb, spikeDurationMs, currentDb, baselineDb, confidence }
  },
  onUpdate: (state) => {
    // state = { isMonitoring, mode, currentDb, baselineDb, spikeAmountDb,
    //           spikeDurationMs, confidence, isSpiking, triggerCount,
    //           lastTriggerTime, error }  -- mode is "normal" | "suspicious"
  },
});

await engine.start();   // requests mic permission; needs a browser
engine.stop();          // releases the mic + audio context
```

You can also pass individual overrides (UPPER_SNAKE or camelCase), e.g.
`new AudioTriggerEngine({ spikeThresholdDb: 30, minConfidence: 0.6 })`, or retune
live with `engine.updateConfig({ sensitivityPreset: "medium" })`.

### Exports

- `AudioTriggerEngine` — the stateful engine.
- `resolveConfig(input)` — merge `DEFAULT_CONFIG` ← preset ← overrides.
- `calculateRms(samples)` — RMS amplitude of a Float32 window.
- `rmsToDb(rms, dbFloor?)` — RMS → relative dBFS.
- `detectSpike(currentDb, baselineDb, config)` — `{ isSpiking, spikeAmountDb }`.
- `computeConfidence(spikeAmountDb, spikeDurationMs, currentDb, config)` — 0..1.
- `DEFAULT_CONFIG`, `SENSITIVITY_PRESETS`.

## Sensitivity presets

| Preset | Spike Δ | Min duration | Floor | Cooldown |
| --- | --- | --- | --- | --- |
| high   | 18 dB | 200 ms | −45 dB | 4 s |
| medium | 27 dB | 200 ms | −45 dB | 5 s |
| **low (default)** | 37 dB | 200 ms | −45 dB | 5 s |

Edit numbers in `SENSITIVITY_PRESETS` / `DEFAULT_CONFIG` at the top of
`audioTriggerEngine.js`.

## Test the core logic

`engine.start()` needs a browser (Web Audio + mic), but the detection logic is
driveable headlessly via `engine.process(currentDb)` — no microphone. From
`backend/`:

```bash
node --input-type=module -e '
import { AudioTriggerEngine } from "./index.js";
const engine = new AudioTriggerEngine({
  sensitivityPreset: "high",
  onTrigger: (e) => console.log("TRIGGER:", e),
});
let t = 0;
for (let i = 0; i < 40; i++) engine.process(-55, t += 100); // quiet baseline
for (let i = 0; i < 6;  i++) engine.process(-10, t += 100); // sustained spike -> fires
'
```

To run live in a browser, import `AudioTriggerEngine` from a page/app and call
`await engine.start()` after a user gesture.
