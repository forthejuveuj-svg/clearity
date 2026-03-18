import { SYSTEM_PROMPT } from "./prompts";

const MODEL = "gpt-4o-mini"; // Fast + cheap for decomposition; user can change

export function hasApiKey() {
  // Server-side integration: no browser key required.
  return true;
}

export function getModel() {
  if (typeof window === "undefined") return MODEL;
  return localStorage.getItem("clearity_model") || MODEL;
}

export function setModel(model) {
  localStorage.setItem("clearity_model", model);
}

/**
 * Call OpenAI via our server route.
 */
export async function callAI(userPrompt, { temperature = 0.3, maxTokens = 2000 } = {}) {
  const model = getModel();

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      prompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
      maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error("Rate limited. Wait a moment and try again.");
    throw new Error(err.error?.message || err.error || `API error: ${response.status}`);
  }

  const data = await response.json().catch(() => ({}));
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) throw new Error("Empty response from AI");
  return text;
}

/**
 * Call AI and parse JSON response, with retry on parse failure.
 */
export async function callAIJson(userPrompt, options = {}) {
  const raw = await callAI(userPrompt, options);

  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON from the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error("AI returned invalid JSON. Try again.");
      }
    }
    throw new Error("AI returned invalid JSON. Try again.");
  }
}
