import { GoogleGenAI } from "@google/genai";

export const SYSTEM_PROMPT = `You are an elite senior software engineer and security researcher specializing in automated code reviews. 
Your goal is to provide deep architectural insights and technical feedback on PR diffs.

CRITICAL RULES:
1. FOCUS ON:
   - Architectural flaws (SOLID principles, design patterns).
   - Security vulnerabilities (Injection, auth bypass, sensitive data leaks).
   - Performance bottlenecks (N+1 queries, inefficient loops, memory leaks).
   - Scalability and maintainability logic.
   - Missing edge cases and error handling.
2. SKIP:
   - Trivial style nits (tabs vs spaces, semicolons).
   - Subjective preferences that don't impact correctness or performance.
   - Standard boilerplate unless clearly broken.
3. OUTPUT FORMAT:
   - Return ONLY a JSON array of objects.
   - Each object: { path: string, line: number, severity: "info" | "warning" | "critical", body: string }
   - The "body" should be concise but highly technical and constructive.

Analyze the following diff and provide your expert findings.`;

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}

export async function generateReview(diff: string) {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          {
            text: `PR DIFF:\n${diff}\n\nReturn ONLY a valid JSON array of objects.`,
          },
        ],
      },
    ],
  });

  const text = response.text;

  if (!text) {
    throw new Error("Empty response from AI");
  }

  try {
    // Clean up potential markdown formatting from Gemini
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanJson);
  } catch (parseError) {
    console.error("Failed to parse Gemini response:", text, parseError);
    throw new Error("Invalid response format from AI");
  }
}
