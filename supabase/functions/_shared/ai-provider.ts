/**
 * AI Provider — Multi-provider routing with retry + fallback + cost logging.
 *
 * Replaces ai-fetch.ts. Routes each AI task to the optimal model/provider:
 *   - parse-cv, ai-prescreen, ai-tailor → Anthropic (Claude Sonnet 4)
 *   - cv-review → Anthropic (Claude Haiku 4.5)
 *   - scrape-job → Google AI (Gemini 2.5 Flash)
 *
 * Fallback: Gemini 2.5 Flash via Google AI (or Lovable Gateway if no Google key).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==================== TYPES ====================

export type AiTask = "parse-cv" | "scrape-job" | "ai-prescreen" | "ai-tailor" | "ai-tailor-analyze" | "cv-review" | "cv-formal-review";

interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

export interface AiRequest {
  task: AiTask;
  systemPrompt: string;
  userMessage: string | Array<Record<string, unknown>>;
  tools?: OpenAITool[];
  toolChoice?: { type: "function"; function: { name: string } };
  maxTokens?: number;
  temperature?: number;
}

export interface AiResponse {
  content: Record<string, unknown>;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  usedFallback: boolean;
}

// ==================== ROUTING ====================

interface ModelConfig {
  provider: "anthropic" | "google" | "lovable";
  model: string;
  fallbackProvider: "google" | "lovable";
  fallbackModel: string;
}

const TASK_ROUTING: Record<AiTask, ModelConfig> = {
  "parse-cv": {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    fallbackProvider: "google",
    fallbackModel: "gemini-2.5-flash",
  },
  "scrape-job": {
    provider: "google",
    model: "gemini-2.5-flash",
    fallbackProvider: "lovable",
    fallbackModel: "google/gemini-2.0-flash",
  },
  "ai-prescreen": {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    fallbackProvider: "google",
    fallbackModel: "gemini-2.5-flash",
  },
  "ai-tailor": {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    fallbackProvider: "google",
    fallbackModel: "gemini-2.5-flash",
  },
  "ai-tailor-analyze": {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    fallbackProvider: "google",
    fallbackModel: "gemini-2.5-flash",
  },
  "cv-review": {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    fallbackProvider: "google",
    fallbackModel: "gemini-2.5-flash",
  },
  "cv-formal-review": {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    fallbackProvider: "google",
    fallbackModel: "gemini-2.5-flash",
  },
};

// ==================== COST RATES (per 1M tokens) ====================

const COST_PER_M: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "gemini-2.5-flash": { input: 0.075, output: 0.3 },
  "google/gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

// ==================== HELPERS ====================

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Convert OpenAI tool format to Anthropic tool format */
function toAnthropicTools(tools: OpenAITool[]): Array<Record<string, unknown>> {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description || "",
    input_schema: t.function.parameters,
  }));
}

/** Convert OpenAI tool_choice to Anthropic tool_choice */
function toAnthropicToolChoice(tc: { type: "function"; function: { name: string } }): Record<string, unknown> {
  return { type: "tool", name: tc.function.name };
}

/** Convert OpenAI messages to Google AI format */
function toGoogleAIContents(
  systemPrompt: string,
  userMessage: string | Array<Record<string, unknown>>
): { systemInstruction: Record<string, unknown>; contents: Array<Record<string, unknown>> } {
  const systemInstruction = { parts: [{ text: systemPrompt }] };

  let userParts: Array<Record<string, unknown>>;
  if (typeof userMessage === "string") {
    userParts = [{ text: userMessage }];
  } else {
    // Convert OpenAI multimodal format to Google AI format
    userParts = userMessage.map((part) => {
      if (part.type === "text") return { text: part.text as string };
      if (part.type === "file" && (part as any).file) {
        const file = (part as any).file;
        const fileData = (file.file_data as string).replace(/^data:[^;]+;base64,/, "");
        return {
          inline_data: {
            mime_type: "application/pdf",
            data: fileData,
          },
        };
      }
      return { text: JSON.stringify(part) };
    });
  }

  return {
    systemInstruction,
    contents: [{ role: "user", parts: userParts }],
  };
}

/** Convert OpenAI tools to Google AI function declarations */
function toGoogleAITools(tools: OpenAITool[]): Array<Record<string, unknown>> {
  return [{
    function_declarations: tools.map((t) => ({
      name: t.function.name,
      description: t.function.description || "",
      parameters: t.function.parameters,
    })),
  }];
}

// ==================== PROVIDER CALLS ====================

interface ProviderResult {
  content: Record<string, unknown> | null;
  tokensIn: number;
  tokensOut: number;
}

async function callAnthropic(request: AiRequest, model: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Build messages — Anthropic uses separate `system` param
  let userContent: unknown;
  if (typeof request.userMessage === "string") {
    userContent = request.userMessage;
  } else {
    // Convert multimodal content for Anthropic
    userContent = request.userMessage.map((part) => {
      if (part.type === "text") return { type: "text", text: part.text };
      if (part.type === "file" && (part as any).file) {
        const file = (part as any).file;
        const base64Data = (file.file_data as string).replace(/^data:[^;]+;base64,/, "");
        return {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        };
      }
      return { type: "text", text: JSON.stringify(part) };
    });
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: request.maxTokens || 4096,
    system: request.systemPrompt,
    messages: [{ role: "user", content: userContent }],
  };

  if (request.tools) {
    body.tools = toAnthropicTools(request.tools);
  }
  if (request.toolChoice) {
    body.tool_choice = toAnthropicToolChoice(request.toolChoice);
  }

  console.log(`[AI] Calling Anthropic ${model}, body size: ${JSON.stringify(body).length} bytes`);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`[AI] Anthropic responded: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Anthropic error (${res.status}):`, errText);
      const error = new Error(`Anthropic error ${res.status}`);
      (error as any).status = res.status;
      throw error;
    }

    const data = await res.json();

    // Extract content from Anthropic response
    const content = parseAnthropicResponse(data);
    const usage = data.usage || {};

    return {
      content,
      tokensIn: usage.input_tokens || 0,
      tokensOut: usage.output_tokens || 0,
    };
  } catch (e) {
    console.error(`[AI] Anthropic fetch error:`, (e as Error).message);
    throw e;
  }
}

function parseAnthropicResponse(data: Record<string, unknown>): Record<string, unknown> | null {
  const contentBlocks = (data as any).content;
  if (!Array.isArray(contentBlocks)) return null;

  // Look for tool_use block first
  const toolUse = contentBlocks.find((b: any) => b.type === "tool_use");
  if (toolUse) {
    return typeof toolUse.input === "string" ? JSON.parse(toolUse.input) : toolUse.input;
  }

  // Fallback: try to parse text content as JSON
  const textBlock = contentBlocks.find((b: any) => b.type === "text");
  if (textBlock?.text) {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  }

  return null;
}

async function callGoogleAI(request: AiRequest, model: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

  const { systemInstruction, contents } = toGoogleAIContents(request.systemPrompt, request.userMessage);

  const body: Record<string, unknown> = {
    system_instruction: systemInstruction,
    contents,
  };

  if (request.tools) {
    body.tools = toGoogleAITools(request.tools);
    if (request.toolChoice) {
      body.tool_config = {
        function_calling_config: {
          mode: "ANY",
          allowed_function_names: [request.toolChoice.function.name],
        },
      };
    }
  }

  console.log(`[AI] Calling Google AI ${model}`);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    console.log(`[AI] Google AI responded: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Google AI error (${res.status}):`, errText);
      const error = new Error(`Google AI error ${res.status}`);
      (error as any).status = res.status;
      throw error;
    }

    const data = await res.json();
    const content = parseGoogleAIResponse(data);
    const usage = data.usageMetadata || {};

    return {
      content,
      tokensIn: usage.promptTokenCount || 0,
      tokensOut: usage.candidatesTokenCount || 0,
    };
  } catch (e) {
    console.error(`[AI] Google AI fetch error:`, (e as Error).message);
    throw e;
  }
}

function parseGoogleAIResponse(data: Record<string, unknown>): Record<string, unknown> | null {
  const candidates = (data as any).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  // Look for function call
  const fnCall = parts.find((p: any) => p.functionCall);
  if (fnCall?.functionCall?.args) {
    return typeof fnCall.functionCall.args === "string"
      ? JSON.parse(fnCall.functionCall.args)
      : fnCall.functionCall.args;
  }

  // Fallback: text content
  const textPart = parts.find((p: any) => p.text);
  if (textPart?.text) {
    const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  }

  return null;
}

/** Fallback to Lovable Gateway (OpenAI-compatible) */
async function callLovableGateway(request: AiRequest, model: string): Promise<ProviderResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: request.systemPrompt },
      {
        role: "user",
        content: typeof request.userMessage === "string"
          ? request.userMessage
          : request.userMessage,
      },
    ],
  };

  if (request.tools) body.tools = request.tools;
  if (request.toolChoice) body.tool_choice = request.toolChoice;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Lovable Gateway error (${res.status}):`, errText);
    const error = new Error(`Lovable Gateway error ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  const content = parseLovableResponse(data);
  const usage = data.usage || {};

  return {
    content,
    tokensIn: usage.prompt_tokens || 0,
    tokensOut: usage.completion_tokens || 0,
  };
}

function parseLovableResponse(data: Record<string, unknown>): Record<string, unknown> | null {
  const toolCall = (data as any).choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
  }

  const content = (data as any).choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return null;
}

// ==================== LOGGING ====================

async function logUsage(
  userId: string | null,
  task: string,
  provider: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  durationMs: number,
  isFallback: boolean
): Promise<void> {
  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !supabaseUrl) return;

    const rates = COST_PER_M[model] || { input: 0, output: 0 };
    const costUsd = (tokensIn * rates.input + tokensOut * rates.output) / 1_000_000;

    const client = createClient(supabaseUrl, serviceKey);
    await client.from("ai_usage_logs").insert({
      user_id: userId,
      task,
      provider,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: costUsd,
      duration_ms: durationMs,
      is_fallback: isFallback,
    });
  } catch (e) {
    console.error("ai_usage_logs insert error:", e);
  }
}

// ==================== MAIN ENTRY ====================

const NON_RETRYABLE = new Set([401, 402, 403, 429]);

async function callProvider(
  provider: "anthropic" | "google" | "lovable",
  model: string,
  request: AiRequest
): Promise<ProviderResult> {
  switch (provider) {
    case "anthropic":
      return callAnthropic(request, model);
    case "google":
      return callGoogleAI(request, model);
    case "lovable":
      return callLovableGateway(request, model);
  }
}

/**
 * Main entry point. Routes to the right provider, retries once, falls back.
 */
export async function callAi(request: AiRequest, userId?: string | null): Promise<AiResponse> {
  const config = TASK_ROUTING[request.task];
  if (!config) throw new Error(`Unknown AI task: ${request.task}`);

  const startMs = Date.now();

  // Try primary provider (up to 2 attempts)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await callProvider(config.provider, config.model, request);

      if (!result.content) throw new Error("Empty AI response");

      const durationMs = Date.now() - startMs;
      // Fire-and-forget logging
      logUsage(userId || null, request.task, config.provider, config.model, result.tokensIn, result.tokensOut, durationMs, false);

      return {
        content: result.content,
        provider: config.provider,
        model: config.model,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        usedFallback: false,
      };
    } catch (e: unknown) {
      const status = (e as any)?.status;
      if (NON_RETRYABLE.has(status)) {
        // For 429/402, propagate so edge function can return appropriate error
        throw e;
      }
      console.warn(`AI ${config.provider} attempt ${attempt + 1} failed:`, (e as Error).message);
      if (attempt === 0) await sleep(2000);
    }
  }

  // Fallback
  console.warn(`Primary ${config.provider}/${config.model} failed, trying fallback: ${config.fallbackProvider}/${config.fallbackModel}`);

  try {
    const result = await callProvider(config.fallbackProvider, config.fallbackModel, request);

    if (!result.content) throw new Error("Empty fallback AI response");

    const durationMs = Date.now() - startMs;
    logUsage(userId || null, request.task, config.fallbackProvider, config.fallbackModel, result.tokensIn, result.tokensOut, durationMs, true);

    return {
      content: result.content,
      provider: config.fallbackProvider,
      model: config.fallbackModel,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      usedFallback: true,
    };
  } catch (e) {
    console.error(`Fallback ${config.fallbackProvider}/${config.fallbackModel} also failed:`, (e as Error).message);
    throw new Error("AI service unavailable");
  }
}
