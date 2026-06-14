import { analyzeClip } from "./geminiAnalyzer.js";
import { decide } from "./decisionEngine.js";

export async function startSuspiciousMode({ videoBase64, mimeType = "video/mp4" }) {
  const { confidence, analysis, spokenInstructions } = await analyzeClip({ videoBase64, mimeType });

  return decide({ confidence, analysis, spokenInstructions, videoBase64 });
}
