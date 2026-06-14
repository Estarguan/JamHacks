import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `
You are a home safety AI analyzing a 30-second video clip from an indoor security camera.
Your job is to determine whether a REAL, genuine emergency or harmful conflict is occurring — not theatrical, playful, or consensual interaction.
Use full context and judgment. People play-fight, joke around, and act dramatically all the time. Your goal is to distinguish genuine harm from normal human behaviour.
When you identify a specific actionable emergency (choking, cardiac arrest, fire, severe bleeding, unconscious person, etc.), also provide calm step-by-step spoken instructions a bystander can follow immediately — these will be spoken aloud in the room by the camera. Keep them short, direct, and in plain language. If no actionable instructions apply, return an empty string.
`;

const prompt = `
Analyze this video clip and rate how likely it is that a REAL, non-consensual, harmful incident is occurring.

HIGH confidence (8-10) — genuine emergency or real harm:
- One person is clearly frightened, in pain, or trying to escape and the other is not stopping
- Real crying, screaming, or begging — not theatrical sounds
- Actual weapons (knives, guns) being used aggressively, not mimed or joked about
- Someone unconscious, injured, or unable to respond
- Fire, smoke, or medical emergency

MEDIUM confidence (4-7) — unclear, could be real or could be play:
- Physical contact that is ambiguous — could be play-fighting or could be real
- Raised voices where it's unclear if it's joking or genuine anger
- One person seems uncomfortable but not clearly in danger
- Simulated or theatrical threats where intent is unclear

LOW confidence (0-3) — clearly not a real emergency:
- Both people are laughing, smiling, or clearly enjoying themselves
- Play-fighting where both parties are clearly consenting and having fun
- Fake or theatrical sounds (fake gun sounds, exaggerated reactions)
- Joking threats or simulated weapons (e.g. pointing a phone like a gun)
- Normal household activity, conversations, or movement
- Staged or clearly performative conflict

Key judgment factors:
- Are both people consenting and comfortable, or is one genuinely trying to get away?
- Are reactions genuine distress or theatrical/exaggerated for fun?
- Does the overall mood suggest danger or playfulness?
- Real emergencies have a different energy — fear, desperation, urgency — versus play which feels light even when loud

Rate your confidence on a scale of 0-10 that a REAL harmful incident is occurring.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    confidence: {
      type: Type.INTEGER,
      description: "Confidence score 0-10 that a real emergency or conflict is occurring.",
    },
    analysis: {
      type: Type.STRING,
      description: "Detailed description of what was detected and why.",
    },
    spokenInstructions: {
      type: Type.STRING,
      description: "Step-by-step spoken instructions for bystanders if the emergency is actionable (choking, cardiac arrest, fire, etc.). Empty string otherwise.",
    },
  },
  required: ["confidence", "analysis", "spokenInstructions"],
};

export async function analyzeClip({ videoBase64, mimeType = "video/mp4" }) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.1,
    },
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: videoBase64 } },
        ],
      },
    ],
  });

  return JSON.parse(response.text);
}
