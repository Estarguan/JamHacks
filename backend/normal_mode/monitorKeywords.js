// monitorKeywords.js
//
// Sixth Sense — terminal keyword trigger using OFFLINE speech-to-text (Vosk).
//
// Pipeline:
//   computer mic ──> sox/rec (16kHz mono 16-bit PCM) ──> stt_vosk.py (Vosk)
//                ──> transcript text ──> detectKeywordTrigger() ──> print on match
//
// Node orchestrates and does the keyword matching; Vosk runs as a tiny Python
// STT subprocess (Python Vosk ships prebuilt wheels, so there is nothing to
// compile and no Node-native dependency). Everything is local: no cloud, no
// paid API, no audio uploaded or stored. Run with:
//
//   npm run monitor-keywords      (Ctrl+C to stop)

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import { detectKeywordTrigger, KEYWORDS } from './keywordTriggerEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_RATE = 16000;

// --- Locate the Vosk model (for a friendly pre-check + message) ------------
function resolveModelPath() {
  if (process.env.VOSK_MODEL_PATH) return process.env.VOSK_MODEL_PATH;
  for (const c of ['model', 'vosk-model-small-en-us-0.15']) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, 'model');
}

function printModelInstructions(modelPath) {
  console.error(`\n✖ Vosk model not found at: ${modelPath}\n`);
  console.error('Download an English model first (see backend/README.md):');
  console.error('  cd backend');
  console.error('  curl -LO https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip');
  console.error('  unzip vosk-model-small-en-us-0.15.zip');
  console.error('  mv vosk-model-small-en-us-0.15 model\n');
  console.error('Or point $VOSK_MODEL_PATH at an existing model folder.\n');
}

const modelPath = resolveModelPath();
if (!fs.existsSync(modelPath)) {
  printModelInstructions(modelPath);
  process.exit(1);
}

// --- Forward a keyword hit to the WebSocket server so the frontend fires ----
function sendKeywordTrigger(phrase, category) {
  const ws = new WebSocket('ws://localhost:8765');
  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'keyword',
      phrase,
      category,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
    ws.close();
  });
  ws.on('error', () => {}); // don't crash if Python server isn't up yet
}

// --- Print a matched-keyword block in the required format ------------------
function handleTranscript(text) {
  if (!text || !text.trim()) return;
  const result = detectKeywordTrigger(text);
  if (!result.matched) {
    console.log(`· ${text}`); // light feedback so you can see it's listening
    return;
  }
  for (const m of result.matches) {
    console.log('\nKEYWORD TRIGGER DETECTED');
    console.log('Mode: suspicious');
    console.log(`Matched phrase: ${m.phrase}`);
    console.log(`Category: ${m.category}`);
    console.log(`Transcript: ${text}\n`);
    sendKeywordTrigger(m.phrase, m.category);
  }
}

// --- Open the microphone via sox/rec ---------------------------------------
// `rec` (from SoX) captures the default input device as raw signed 16-bit mono
// PCM at 16kHz on stdout — exactly what Vosk expects.
const recorder = spawn('rec', [
  '-q',
  '-r', String(SAMPLE_RATE),
  '-c', '1',
  '-b', '16',
  '-e', 'signed-integer',
  '-t', 'raw',
  '-',
]);

recorder.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n✖ Microphone capture failed: `rec`/SoX not found on PATH.');
    console.error('Install SoX:  brew install sox   (then make sure it is on your PATH)\n');
  } else {
    console.error('\n✖ Microphone capture error:', err.message, '\n');
  }
  cleanup(1);
});

// --- Run Vosk in a Python STT subprocess -----------------------------------
const stt = spawn('python3', [path.join(__dirname, 'stt_vosk.py')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

stt.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n✖ Could not start speech-to-text: `python3` not found.');
    console.error('Install Python 3, then:  python3 -m pip install vosk\n');
  } else {
    console.error('\n✖ Speech-to-text error:', err.message, '\n');
  }
  cleanup(1);
});

// Feed microphone audio into Vosk.
recorder.stdout.pipe(stt.stdin);
recorder.stdout.on('error', () => {}); // ignore EPIPE on shutdown

// Read transcript lines out of Vosk.
const rl = readline.createInterface({ input: stt.stdout });
rl.on('line', (line) => handleTranscript(line));

// Surface a missing-model error from Python; ignore other (harmless) stderr.
stt.stderr.on('data', (d) => {
  const s = d.toString();
  if (s.includes('MODEL_NOT_FOUND')) {
    printModelInstructions(modelPath);
    cleanup(1);
  }
});

stt.on('exit', (code) => {
  if (!shuttingDown && code && code !== 0) {
    console.error(`\n✖ Speech-to-text process exited (code ${code}).`);
    console.error('Is vosk installed?  python3 -m pip install vosk\n');
    cleanup(1);
  }
});

// --- Clean shutdown --------------------------------------------------------
let shuttingDown = false;
function cleanup(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  try { rl.close(); } catch { /* ignore */ }
  for (const child of [recorder, stt]) {
    try { if (child && !child.killed) child.kill('SIGTERM'); } catch { /* ignore */ }
  }
  console.log('\nStopped.');
  process.exit(code);
}

process.on('SIGINT', () => cleanup(0)); // Ctrl+C
process.on('SIGTERM', () => cleanup(0));

console.log('Sixth Sense — offline keyword monitor (Vosk via Python STT)');
console.log(`Model: ${modelPath}`);
console.log(`Watching ${KEYWORDS.length} flagged phrases.`);
console.log('Listening on your microphone… press Ctrl+C to stop.\n');
