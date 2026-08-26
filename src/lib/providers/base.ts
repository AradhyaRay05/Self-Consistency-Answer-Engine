import type { ChatMessage } from "../types";

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export async function chatCompletion(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs = 60000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const content = extractText(data);
    if (!content) throw new Error("Empty response from provider");
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

function extractText(data: Record<string, unknown>): string {
  if (Array.isArray(data.choices)) {
    const choices = data.choices as Array<{ message?: { content?: string } }>;
    return choices[0]?.message?.content ?? "";
  }
  if (Array.isArray(data.content)) {
    const blocks = data.content as Array<{ text?: string; type?: string }>;
    return blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
  }
  if (Array.isArray(data.candidates)) {
    const candidates = data.candidates as Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    return (
      candidates[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
    );
  }
  return "";
}

export function mockAnswer(modelName: string, messages: ChatMessage[]): string {
  const question =
    messages.filter((m) => m.role === "user").at(-1)?.content ?? "the prompt";
  return [
    `[${modelName} — simulated response]`,
    ``,
    `Here is my take on: "${question.slice(0, 160)}${question.length > 160 ? "..." : ""}"`,
    ``,
    `1. Direct answer: The most reasonable conclusion based on careful analysis.`,
    `2. Key reasoning: I broke the problem into parts, checked each assumption, and verified the result step by step.`,
    `3. Caveats: This perspective is one of several; the evaluator will weigh it against the other models' answers.`,
  ].join("\n");
}
