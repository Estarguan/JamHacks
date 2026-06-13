// index.js — minimal entry point for the Sixth Sense audio-spike trigger.
//
// Import the engine and helpers from here:
//
//   import { AudioTriggerEngine } from "./backend/index.js";
//
//   const engine = new AudioTriggerEngine({
//     sensitivityPreset: "low",
//     onTrigger: (event) => console.log("Trigger detected:", event),
//     onUpdate: (state) =>
//       console.log(state.currentDb, state.baselineDb, state.spikeAmountDb),
//   });
//
//   await engine.start(); // needs a browser (Web Audio + mic)
//   // engine.stop();
//
// This is a headless module — there is no UI. Web Audio + microphone access
// only exist in a browser context, so engine.start() must run in the browser.
// The pure helpers (calculateRms, rmsToDb, detectSpike, resolveConfig,
// computeConfidence) and engine.process(db) run anywhere, including Node.

export {
  AudioTriggerEngine,
  DEFAULT_CONFIG,
  SENSITIVITY_PRESETS,
  resolveConfig,
  calculateRms,
  rmsToDb,
  detectSpike,
  computeConfidence,
} from './normal_mode/audioTriggerEngine.js';
