import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `
You are a home safety AI analyzing a 30-second video clip from an indoor security camera.
Your job is to detect any violence, physical aggression, conflict, or situation that could escalate into harm.
Err on the side of caution — it is better to flag something that turns out to be minor than to miss a real incident.
Do NOT assume intent or context. Report all physical contact and conflict signs factually.
`;

const prompt = `
Analyze this video clip and flag any of the following:

PHYSICAL VIOLENCE (flag immediately, high confidence):
- Any slap, hit, punch, kick, shove, or strike between people — even if brief, even if it looks minor
- Grabbing, restraining, or forcing someone
- Someone being knocked down or thrown
- Any weapon being used or threatened

VERBAL CONFLICT (flag, medium-high confidence):
- Shouting, yelling, or screaming at another person
- Aggressive arguing, threatening language, or verbal abuse
- Crying in distress
- Rapid, overlapping, or escalating back-and-forth speech

ESCALATING TENSION (flag, medium confidence):
- Aggressive posturing, finger-pointing, or getting in someone's face
- Sudden fast or tense body movement between people
- One person cornering or following another
- Objects being thrown or slammed

EMERGENCIES (flag immediately, high confidence):
- Fire, smoke, or alarms
- Someone falling and not getting up
- Signs of medical distress

Do NOT assume physical contact is playful. Do NOT dismiss brief or seemingly minor incidents.
When in doubt, flag it with a medium confidence score rather than ignoring it.

Rate your confidence on a scale of 0-10:
0-3: normal activity, no signs of conflict or danger
4-7: tension, argument, or physical contact detected — context unclear or situation could escalate
8-10: clear violence, aggression, or emergency occurring
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
  },
  required: ["confidence", "analysis"],
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
