/**
 * Shared utility: AI gateway fetch with retry + fallback model.
 *
 * - Max 2 retries with backoff (1s, 3s)
 * - 401/402/429 are NOT retried (throw immediately)
 * - On persistent failure, retries once with fallback model
 */

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FALLBACK_MODEL = "google/gemini-2.0-flash";
const NON_RETRYABLE = new Set([401, 402, 429]);

interface AIFetchOptions {
  model: string;
  messages: Array<{ role: string; content: unknown }>;
  tools?: unknown[];
  tool_choice?: unknown;
}

interface AIFetchResult {
  data: Record<string, unknown>;
  usedFallback: boolean;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getApiKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  return key;
}

async function doFetch(
  apiKey: string,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Extracts the parsed result from AI response (tool call or content fallback).
 * Returns null if nothing parseable found.
 */
export function parseAIResponse(aiData: Record<string, unknown>): Record<string, unknown> | null {
  const toolCall = (aiData as any).choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
  }

  const content = (aiData as any).choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return null;
}

/**
 * Main entry: call AI gateway with retry + fallback.
 */
export async function aiFetch(options: AIFetchOptions): Promise<AIFetchResult> {
  const apiKey = getApiKey();
  const backoffs = [1000, 3000];

  // Try with primary model (up to 3 attempts: initial + 2 retries)
  for (let attempt = 0; attempt <= 2; attempt++) {
    const body = {
      model: options.model,
      messages: options.messages,
      ...(options.tools && { tools: options.tools }),
      ...(options.tool_choice && { tool_choice: options.tool_choice }),
    };

    const res = await doFetch(apiKey, body);

    if (res.ok) {
      const data = await res.json();
      return { data, usedFallback: false };
    }

    // Non-retryable errors: throw with status info
    if (NON_RETRYABLE.has(res.status)) {
      const errText = await res.text();
      console.error(`AI non-retryable error (${res.status}):`, errText);
      const error = new Error(`AI error ${res.status}`);
      (error as any).status = res.status;
      throw error;
    }

    console.warn(`AI attempt ${attempt + 1} failed (${res.status})`);
    if (attempt < 2) await sleep(backoffs[attempt]);
  }

  // All retries failed with primary model — try fallback
  console.warn(`Primary model failed, trying fallback: ${FALLBACK_MODEL}`);
  const fallbackBody = {
    model: FALLBACK_MODEL,
    messages: options.messages,
    ...(options.tools && { tools: options.tools }),
    ...(options.tool_choice && { tool_choice: options.tool_choice }),
  };

  const fallbackRes = await doFetch(apiKey, fallbackBody);
  if (!fallbackRes.ok) {
    const errText = await fallbackRes.text();
    console.error(`Fallback model also failed (${fallbackRes.status}):`, errText);
    throw new Error("AI service unavailable");
  }

  const data = await fallbackRes.json();
  return { data, usedFallback: true };
}
