import { readFileSync } from "fs";
import { startSuspiciousMode } from "./suspicious_mode/suspiciousController.js";

const videoPath = process.argv[2];

if (!videoPath) {
  console.error("Usage: node test.js <path-to-video.mp4>");
  process.exit(1);
}

const ext = videoPath.split(".").pop().toLowerCase();
const mimeTypes = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
const mimeType = mimeTypes[ext] ?? "video/mp4";

const videoBase64 = readFileSync(videoPath).toString("base64");

console.log("Sending clip to Gemini for analysis...\n");

const result = await startSuspiciousMode({ videoBase64, mimeType });

console.log("Decision:", result.decision);
console.log("Confidence:", result.confidence ?? "N/A");
console.log("Analysis:", result.analysis ?? "N/A");

if (result.decision === "send_alert") {
  console.log("\n ALERT WOULD BE SENT TO USER");
} else if (result.decision === "return_to_normal") {
  console.log("\n Returning to normal mode");
} else {
  console.log("\n Would continue analyzing next 30 seconds");
}
