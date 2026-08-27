import type { ChatMessage, ModelResponse } from "../types";
import { chatCompletion, getEnv, mockAnswer, type ProviderConfig } from "./base";

export interface Provider {
  id: "openai" | "anthropic" | "gemini";
  displayName: string;
  config: ProviderConfig | null;
  call: (messages: ChatMessage[], system?: string) => Promise<string>;
}

// Branded identities — shown in the UI as ChatGPT / Claude / Gemini
// regardless of the underlying gateway model (Groq, aicredits, etc.).
export const IDENTITY: Record<Provider["id"], string> = {
  openai: "You are ChatGPT, a large language model created by OpenAI. Always identify yourself as ChatGPT by OpenAI when asked who you are. Never claim to be Nex, Nex-AGI, Gemini, Claude, or any other model. Respond helpfully.",
  anthropic: "You are Claude, created by Anthropic. Always identify yourself as Claude by Anthropic when asked who you are. Never reveal that you are Nex, Nex-AGI, or any other underlying model. You are Claude. Respond helpfully.",
  gemini: "You are Gemini, created by Google. Always identify yourself as Gemini by Google when asked who you are. Never claim to be ChatGPT, Claude, Nex, or any other model. Respond helpfully.",
};

function openaiConfig(): ProviderConfig | null {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    model: getEnv("OPENAI_MODEL", "gpt-4o"),
  };
}

function anthropicConfig(): ProviderConfig | null {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: getEnv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1"),
    model: getEnv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
  };
}

function geminiConfig(): ProviderConfig | null {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: getEnv(
      "GEMINI_BASE_URL",
      "https://generativelanguage.googleapis.com/v1beta"
    ),
    model: getEnv("GEMINI_MODEL", "gemini-2.0-flash"),
  };
}

// Gateways (OpenRouter, Groq, aicredits…) expose an OpenAI-compatible API;
// only the official hostnames use their native protocols.
function usesNativeProtocol(
  slot: "anthropic" | "gemini",
  baseUrl: string
): boolean {
  if (slot === "anthropic") return baseUrl.includes("anthropic.com");
  return baseUrl.includes("generativelanguage");
}

async function callOpenAICompatible(
  config: ProviderConfig,
  messages: ChatMessage[],
  system?: string
): Promise<string> {
  return chatCompletion(`${config.baseUrl}/chat/completions`, {
    Authorization: `Bearer ${config.apiKey}`,
  }, {
    model: config.model,
    messages: system
      ? [{ role: "system", content: system }, ...messages]
      : messages,
    temperature: 0.7,
  });
}

async function callAnthropic(
  config: ProviderConfig,
  messages: ChatMessage[],
  system?: string
): Promise<string> {
  return chatCompletion(`${config.baseUrl}/messages`, {
    "x-api-key": config.apiKey,
    "anthropic-version": "2023-06-01",
  }, {
    model: config.model,
    max_tokens: 2048,
    ...(system ? { system } : {}),
    messages,
    temperature: 0.7,
  });
}

async function callGemini(
  config: ProviderConfig,
  messages: ChatMessage[],
  system?: string
): Promise<string> {
  return chatCompletion(
    `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
    {},
    {
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { temperature: 0.7 },
    }
  );
}

export function createProviders(): Provider[] {
  const openaiCfg = openaiConfig();
  const anthropicCfg = anthropicConfig();
  const geminiCfg = geminiConfig();

  return [
    {
      id: "openai",
      displayName: "ChatGPT",
      config: openaiCfg,
      async call(messages, system) {
        if (!openaiCfg) return mockAnswer("ChatGPT", messages);
        // Evaluator passes its own system; otherwise use branded identity
        const effective = system ?? IDENTITY.openai;
        return callOpenAICompatible(openaiCfg, messages, effective);
      },
    },
    {
      id: "anthropic",
      displayName: "Claude",
      config: anthropicCfg,
      async call(messages, system) {
        if (!anthropicCfg) return mockAnswer("Claude", messages);
        const effective = system ?? IDENTITY.anthropic;
        if (usesNativeProtocol("anthropic", anthropicCfg.baseUrl)) {
          return callAnthropic(anthropicCfg, messages, effective);
        }
        return callOpenAICompatible(anthropicCfg, messages, effective);
      },
    },
    {
      id: "gemini",
      displayName: "Gemini",
      config: geminiCfg,
      async call(messages, system) {
        if (!geminiCfg) return mockAnswer("Gemini", messages);
        const effective = system ?? IDENTITY.gemini;
        if (usesNativeProtocol("gemini", geminiCfg.baseUrl)) {
          return callGemini(geminiCfg, messages, effective);
        }
        return callOpenAICompatible(geminiCfg, messages, effective);
      },
    },
  ];
}

export async function runProvider(
  provider: Provider,
  messages: ChatMessage[]
): Promise<ModelResponse> {
  const start = Date.now();
  try {
    const answer = await provider.call(messages);
    return {
      modelId: provider.id,
      displayName: provider.displayName,
      status: provider.config ? "success" : "mock",
      answer,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      modelId: provider.id,
      displayName: provider.displayName,
      status: "error",
      answer: "",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
