import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { startSuspiciousMode } from "./suspicious_mode/suspiciousController.js";
import { registerToken, sendAlertNotification } from "./services/pushNotification.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "200mb" }));

// --- ElevenLabs TTS ---
let latestAudio = null;

async function generateSpeech(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!voiceId || !apiKey || apiKey === 'your_elevenlabs_key_here') return null;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    console.error('[elevenlabs] error:', res.status, await res.text());
    return null;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  latestAudio = buf;
  return buf;
}

app.get('/audio/latest', (req, res) => {
  if (!latestAudio) return res.status(503).send('No audio available');
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(latestAudio);
});

// --- Camera frame relay ---
let latestFrame = null;
const mjpegClients = new Set();

function pushFrame(res, frame) {
  try {
    res.write("--boundary\r\n");
    res.write("Content-Type: image/jpeg\r\n");
    res.write(`Content-Length: ${frame.length}\r\n\r\n`);
    res.write(frame);
    res.write("\r\n");
  } catch {}
}

app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=boundary");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  mjpegClients.add(res);
  if (latestFrame) pushFrame(res, latestFrame);
  req.on("close", () => mjpegClients.delete(res));
});

app.get("/latest-frame", (req, res) => {
  if (!latestFrame) return res.status(503).send("No frame available");
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(latestFrame);
});

app.post("/test-speech", async (req, res) => {
  const text = "Alert. Someone appears to be choking. Stand behind them and make a fist with one hand. Place it just above their belly button. Grab your fist with your other hand and give quick inward and upward thrusts. Repeat until the object is cleared or emergency services arrive."
  console.log('[test-speech] key:', process.env.ELEVENLABS_API_KEY?.slice(0, 8), 'voice:', process.env.ELEVENLABS_VOICE_ID)
  const audio = await generateSpeech(text)
  if (!audio) return res.status(500).json({ error: 'ElevenLabs failed — check backend console' })
  res.json({ ok: true, bytes: audio.length })
})

app.post("/test-notification", async (req, res) => {
  await sendAlertNotification({
    confidence: 0.9,
    analysis: { summary: 'Test alert — high risk activity detected in Kitchen.' },
  })
  res.json({ ok: true })
})

app.post("/test-notification-2", async (req, res) => {
  await sendAlertNotification({
    confidence: 0.5,
    analysis: { summary: 'Test alert — medium risk verbal conflict detected in Living Room.' },
  })
  res.json({ ok: true })
})

app.post("/register-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });
  registerToken(token);
  res.json({ ok: true });
});

app.post("/analyze", async (req, res) => {
  const { videoBase64, mimeType } = req.body;
  try {
    const result = await startSuspiciousMode({ videoBase64, mimeType });

    if (result.decision === "send_alert") {
      sendAlertNotification({ confidence: result.confidence, analysis: result.analysis });
    }
    res.json(result);
  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws/frames" });
wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    latestFrame = data;
    for (const client of mjpegClients) pushFrame(client, data);
  });
});

server.listen(3001, () => console.log("Analyze server running on http://localhost:3001"));
