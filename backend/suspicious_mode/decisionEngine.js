import {
  CONFIDENCE_ALERT_THRESHOLD,
  CONFIDENCE_NORMAL_THRESHOLD,
} from "./constants.js";

export function decide({ confidence, analysis, videoBase64 }) {
  if (confidence >= CONFIDENCE_ALERT_THRESHOLD) {
    return {
      decision: "send_alert",
      confidence,
      analysis,
      videoBase64,
    };
  }

  if (confidence < CONFIDENCE_NORMAL_THRESHOLD) {
    return { decision: "return_to_normal", confidence, analysis };
  }

  return { decision: "continue_analyzing", confidence, analysis };
}
