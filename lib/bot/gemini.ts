import { KNOWLEDGE } from "@/data/bot-knowledge";

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const FALLBACK =
  "Sorry, the AI assistant is having trouble right now. Please try again in a moment, or type *menu* to go back.";

const SYSTEM_PROMPT = `You are a professional, persuasive sales representative for PLN Icon Plus.
Rules:
1. Do NOT use any emojis.
2. Answer using the reference knowledge below.
3. Always mention relevant advantages (e.g. pure fiber optic, backed by a state-owned enterprise, stable grid-based network).
4. Avoid overly technical jargon; keep it clear and marketing-friendly.
5. End with a short call to action to subscribe or consult.
6. Answer in English. Keep it concise (under ~120 words).

Reference knowledge:
${KNOWLEDGE}`;

export async function askProduct(question: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return FALLBACK;

  try {
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
      }),
    });

    if (!res.ok) return FALLBACK;

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || FALLBACK;
  } catch {
    return FALLBACK;
  }
}
