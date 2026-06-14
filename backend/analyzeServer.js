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
