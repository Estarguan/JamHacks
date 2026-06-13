// audioTriggerEngine.js
//
// Sixth Sense — headless, privacy-first audio-spike trigger engine.
//
// This module measures ONLY loudness. It never records, stores, or uploads
// audio, and never calls AI. It reads the live mic stream, computes an RMS
// loudness value every ~100ms, maintains a slowly-adapting baseline of "normal"
// for the current room, and fires an onTrigger callback when loudness suddenly
// jumps far above that baseline, stays up long enough, clears a loudness floor,
// and the cooldown has passed.
//
// Web Audio loudness is relative dBFS, so values are negative — we only care
// about the DIFFERENCE between currentDb and the adaptive baselineDb.
//
// Usage:
//   const engine = new AudioTriggerEngine({
//     sensitivityPreset: "low",
//     onTrigger: (event) => console.log("Trigger detected:", event),
//     onUpdate: (state) => console.log(state.currentDb, state.baselineDb),
//   });
//   await engine.start();
//   // ...later...
//   engine.stop();

// =====================================================================
// Config + sensitivity presets — the main knobs for tuning the trigger.
// =====================================================================

/** Base tuning constants. Matches the "low" (least sensitive) preset. */
export const DEFAULT_CONFIG = {
  FRAME_INTERVAL_MS: 100, // how often we sample loudness
  SPIKE_THRESHOLD_DB: 37, // currentDb must be this far above baseline to count
  MIN_SPIKE_DURATION_MS: 200, // a spike must last this long to fire
  MIN_LOUDNESS_FLOOR_DB: -45, // ignore spikes quieter than this (quiet-room noise)
  BASELINE_ALPHA: 0.03, // EMA factor: small = baseline adapts slowly
  SPIKE_BASELINE_FREEZE_DB: 12, // if this far above baseline, freeze baseline updates
  COOLDOWN_MS: 5000, // same loud event won't re-fire within this window
  MIN_CONFIDENCE: 0, // confidence (0..1) required to fire (0 = no gate)
  TRIGGER_HOLD_MS: 2000, // how long mode stays "suspicious" after a trigger
  DB_FLOOR: -100, // lowest dB we report (true silence)
};

/**
 * Sensitivity presets. "high" = easiest to trigger, "low" = hardest (fewest
 * false positives). Each preset overrides only the fields that change how
 * readily a trigger fires.
 */
export const SENSITIVITY_PRESETS = {
  high: {
    SPIKE_THRESHOLD_DB: 18,
    MIN_SPIKE_DURATION_MS: 200,
    MIN_LOUDNESS_FLOOR_DB: -45,
    SPIKE_BASELINE_FREEZE_DB: 10,
    COOLDOWN_MS: 4000,
    MIN_CONFIDENCE: 0,
  },
  medium: {
    SPIKE_THRESHOLD_DB: 27,
    MIN_SPIKE_DURATION_MS: 200,
    MIN_LOUDNESS_FLOOR_DB: -45,
    SPIKE_BASELINE_FREEZE_DB: 12,
    COOLDOWN_MS: 5000,
    MIN_CONFIDENCE: 0,
  },
  low: {
    SPIKE_THRESHOLD_DB: 37,
    MIN_SPIKE_DURATION_MS: 200,
    MIN_LOUDNESS_FLOOR_DB: -45,
    SPIKE_BASELINE_FREEZE_DB: 12,
    COOLDOWN_MS: 5000,
    MIN_CONFIDENCE: 0,
  },
};

// Map friendly camelCase keys -> internal UPPER_SNAKE config keys.
const CONFIG_ALIASES = {
  frameIntervalMs: 'FRAME_INTERVAL_MS',
  spikeThresholdDb: 'SPIKE_THRESHOLD_DB',
  minSpikeDurationMs: 'MIN_SPIKE_DURATION_MS',
  minLoudnessFloorDb: 'MIN_LOUDNESS_FLOOR_DB',
  baselineAlpha: 'BASELINE_ALPHA',
  spikeBaselineFreezeDb: 'SPIKE_BASELINE_FREEZE_DB',
  cooldownMs: 'COOLDOWN_MS',
  minConfidence: 'MIN_CONFIDENCE',
  triggerHoldMs: 'TRIGGER_HOLD_MS',
  dbFloor: 'DB_FLOOR',
};

/**
 * Build a full config from DEFAULT_CONFIG <- sensitivity preset <- overrides.
 * Accepts both UPPER_SNAKE and camelCase override keys. Non-config keys
 * (e.g. onTrigger/onUpdate callbacks) are ignored, so you can pass the whole
 * options object straight in.
 */
export function resolveConfig(input = {}) {
  const presetName = input.sensitivityPreset || 'low';
  const preset = SENSITIVITY_PRESETS[presetName] || {};
  const config = { ...DEFAULT_CONFIG, ...preset };
  for (const [key, value] of Object.entries(input)) {
    if (key === 'sensitivityPreset') continue;
    const target = CONFIG_ALIASES[key] || key; // accept camelCase or UPPER_SNAKE
    if (target in config) config[target] = value;
  }
  return config;
}

// =====================================================================
// Pure, stateless DSP helpers (testable without a microphone).
// =====================================================================

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Root-mean-square amplitude of a Float32 sample window (0..1). */
export function calculateRms(samples) {
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumSquares / samples.length);
}

/** Convert RMS (0..1) to a relative dBFS value (<= 0), clamped to [dbFloor, 0]. */
export function rmsToDb(rms, dbFloor = DEFAULT_CONFIG.DB_FLOOR) {
  if (rms > 0) return clamp(20 * Math.log10(rms), dbFloor, 0);
  return dbFloor; // guard against log10(0) = -Infinity
}

/**
 * Frame-level spike check: is currentDb far enough above the baseline AND loud
 * enough in absolute terms? Returns { isSpiking, spikeAmountDb }.
 */
export function detectSpike(currentDb, baselineDb, config = DEFAULT_CONFIG) {
  const spikeAmountDb = currentDb - baselineDb;
  const isSpiking =
    spikeAmountDb >= config.SPIKE_THRESHOLD_DB &&
    currentDb >= config.MIN_LOUDNESS_FLOOR_DB;
  return { isSpiking, spikeAmountDb };
}

/**
 * Confidence 0..1 — blends how big the spike is, how long it lasted, and how
 * loud the absolute peak is. Bigger / longer / louder => more confident.
 */
export function computeConfidence(spikeAmountDb, spikeDurationMs, currentDb, config = DEFAULT_CONFIG) {
  const spikeAmountScore = clamp((spikeAmountDb - config.SPIKE_THRESHOLD_DB) / 30, 0, 1);
  const durationScore = clamp(spikeDurationMs / 1500, 0, 1);
  const loudnessScore = clamp(
    (currentDb - config.MIN_LOUDNESS_FLOOR_DB) / (0 - config.MIN_LOUDNESS_FLOOR_DB),
    0,
    1,
  );
  return clamp(spikeAmountScore * 0.5 + durationScore * 0.3 + loudnessScore * 0.2, 0, 1);
}

/** Live state shape passed to onUpdate. */
function createInitialState() {
  return {
    isMonitoring: false,
    mode: 'normal', // "normal" | "suspicious"
    currentDb: -100,
    baselineDb: -100,
    spikeAmountDb: 0,
    spikeDurationMs: 0,
    lastTriggerTime: null, // epoch ms of the last fired trigger
    triggerCount: 0,
    confidence: 0, // 0..1
    isSpiking: false, // is THIS frame above the spike threshold
    error: null, // user-facing error (e.g. permission denied)
  };
}

// =====================================================================
// The engine.
// =====================================================================

export class AudioTriggerEngine {
  /**
   * @param {object} [options]
   * @param {string}            [options.sensitivityPreset="low"]  "high" | "medium" | "low"
   * @param {(event) => void}   [options.onTrigger]  fires once per confirmed trigger
   * @param {(state) => void}   [options.onUpdate]   fires every frame with live state
   * @param {...number}         [options.<config>]   any DEFAULT_CONFIG override (UPPER_SNAKE or camelCase)
   */
  constructor(options = {}) {
    this.config = resolveConfig(options);
    this.onTrigger = options.onTrigger || (() => {});
    this.onUpdate = options.onUpdate || (() => {});

    this.state = createInitialState();

    // Web Audio handles (kept so we can fully tear them down on stop()).
    this._stream = null;
    this._audioContext = null;
    this._analyser = null;
    this._sampleBuffer = null;
    this._intervalId = null;

    // Internal detection bookkeeping.
    this._baselineInitialized = false;
    this._triggerHoldUntil = 0; // timestamp until which mode stays "suspicious"
  }

  /** Re-tune at any time (even while monitoring); next frame uses the new config. */
  updateConfig(options = {}) {
    this.config = resolveConfig(options);
  }

  /** Begin monitoring. Requests mic permission and starts the loudness loop. */
  async start() {
    if (this.state.isMonitoring) return;

    this.state = { ...createInitialState(), isMonitoring: true };
    this._baselineInitialized = false;
    this._triggerHoldUntil = 0;

    try {
      // Request microphone permission. Disable the browser's own processing so
      // it doesn't distort our raw loudness reading.
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (err) {
      const message =
        err && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow mic access to monitor.'
          : `Could not access microphone: ${err && err.message ? err.message : err}`;
      this.state = { ...createInitialState(), error: message };
      this.onUpdate({ ...this.state });
      return;
    }

    // Build the audio graph: mic source -> analyser. The analyser is never
    // connected to the speakers, so nothing is played back or recorded.
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this._audioContext = new AudioContextClass();
    const source = this._audioContext.createMediaStreamSource(this._stream);
    this._analyser = this._audioContext.createAnalyser();
    this._analyser.fftSize = 2048; // larger window = steadier RMS reading
    source.connect(this._analyser);
    this._sampleBuffer = new Float32Array(this._analyser.fftSize);

    // Sample loudness continuously, every FRAME_INTERVAL_MS.
    this._intervalId = setInterval(() => this._tick(), this.config.FRAME_INTERVAL_MS);

    this.onUpdate({ ...this.state });
  }

  /** Stop monitoring and fully release the microphone + audio context. */
  stop() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }
    if (this._audioContext) {
      this._audioContext.close().catch(() => {});
      this._audioContext = null;
    }
    this._analyser = null;
    this._sampleBuffer = null;

    this.state = { ...this.state, isMonitoring: false, isSpiking: false, mode: 'normal' };
    this.onUpdate({ ...this.state });
  }

  /** Read one mic frame, convert to dB, and advance the detector. */
  _tick() {
    if (!this._analyser) return;
    this._analyser.getFloatTimeDomainData(this._sampleBuffer);
    const rms = calculateRms(this._sampleBuffer);
    const currentDb = rmsToDb(rms, this.config.DB_FLOOR);
    this.process(currentDb);
  }

  /**
   * Advance the detector by one frame using a precomputed dB value. Used by the
   * mic loop, and also callable directly to drive the engine from any audio
   * source or from tests (no microphone required).
   */
  process(currentDb, now = Date.now()) {
    const cfg = this.config;

    // Initialize the baseline to the first reading we see.
    if (!this._baselineInitialized) {
      this.state.baselineDb = currentDb;
      this._baselineInitialized = true;
    }

    const baselineDb = this.state.baselineDb;
    const { isSpiking, spikeAmountDb } = detectSpike(currentDb, baselineDb, cfg);

    // Adapt the baseline SLOWLY, but freeze it during loud moments so a sudden
    // spike never gets absorbed into "normal".
    if (spikeAmountDb < cfg.SPIKE_BASELINE_FREEZE_DB) {
      this.state.baselineDb = baselineDb + cfg.BASELINE_ALPHA * (currentDb - baselineDb);
    }

    // Track how long the current spike has been sustained.
    const spikeDurationMs = isSpiking
      ? this.state.spikeDurationMs + cfg.FRAME_INTERVAL_MS
      : 0;

    const confidence = computeConfidence(spikeAmountDb, spikeDurationMs, currentDb, cfg);

    // Fire only when: big enough spike, sustained long enough, loud enough,
    // confident enough, and the cooldown has passed.
    const cooldownPassed =
      this.state.lastTriggerTime === null ||
      now - this.state.lastTriggerTime >= cfg.COOLDOWN_MS;

    let triggerCount = this.state.triggerCount;
    let lastTriggerTime = this.state.lastTriggerTime;
    let firedEvent = null;

    if (
      isSpiking &&
      spikeAmountDb >= cfg.SPIKE_THRESHOLD_DB &&
      spikeDurationMs >= cfg.MIN_SPIKE_DURATION_MS &&
      currentDb >= cfg.MIN_LOUDNESS_FLOOR_DB &&
      confidence >= cfg.MIN_CONFIDENCE &&
      cooldownPassed
    ) {
      triggerCount += 1;
      lastTriggerTime = now;
      this._triggerHoldUntil = now + cfg.TRIGGER_HOLD_MS;
      // No audio uploaded, no AI called — just a lightweight event payload.
      firedEvent = {
        time: now,
        spikeAmountDb,
        spikeDurationMs,
        currentDb,
        baselineDb: this.state.baselineDb,
        confidence,
      };
    }

    // Mode is only ever "normal" or "suspicious".
    const mode = isSpiking || now < this._triggerHoldUntil ? 'suspicious' : 'normal';

    this.state = {
      ...this.state,
      mode,
      currentDb,
      spikeAmountDb,
      spikeDurationMs,
      isSpiking,
      confidence,
      triggerCount,
      lastTriggerTime,
    };

    this.onUpdate({ ...this.state });
    if (firedEvent) this.onTrigger(firedEvent);

    return this.state;
  }
}
