import type { ModelResponse, SynthesisResult } from "./types";
import { createProviders } from "./providers";
import { chatCompletion, getEnv } from "./providers/base";

const EVALUATOR_SYSTEM_PROMPT = `You are an expert answer evaluator and synthesizer (shown as Claude in the UI).

You will receive one user question and several candidate answers produced by different AI models (ChatGPT, Claude, Gemini).

Think step by step BEFORE synthesizing:
- First, carefully compare all candidates. Note where they agree (high-confidence) and where they conflict.
- Then, score each candidate on correctness, completeness, clarity, and reasoning quality.
- Identify the strongest paragraphs, facts, and explanations from each. Discard incorrect, vague, or hallucinatory content.
- Finally, synthesize a new answer that is strictly better than any single candidate — do NOT copy any candidate verbatim. Combine the best elements into one coherent, accurate, well-structured response.

Respond in exactly this format:

REASONING:
<2-4 sentences: which candidates agreed, which parts you kept from each, which you discarded and why — this is your thinking trace>

FINAL ANSWER:
<the refined best answer, well formatted with markdown if helpful>`;

export function buildEvaluatorPrompt(
  question: string,
  responses: ModelResponse[]
): string {
  const sections = responses.map(
    (r) =>
      `=== Candidate from ${r.displayName} (${r.status}) ===\n${
        r.answer || `(no answer: ${r.error ?? "unavailable"})`
      }`
  );
  return `User question:\n${question}\n\nCandidate answers:\n\n${sections.join(
    "\n\n"
  )}\n\nNow evaluate and synthesize the best possible final answer.`;
}

export function parseEvaluatorOutput(raw: string): {
  reasoning: string;
  answer: string;
} {
  const reasoningMatch = raw.match(
    /REASONING:\s*([\s\S]*?)(?:FINAL ANSWER:|$)/i
  );
  const answerMatch = raw.match(/FINAL ANSWER:\s*([\s\S]*)/i);

  return {
    reasoning: reasoningMatch?.[1]?.trim() || "",
    answer:
      answerMatch?.[1]?.trim() ||
      raw.replace(/REASONING:[\s\S]*?FINAL ANSWER:/i, "").trim() ||
      raw.trim(),
  };
}

function getEvaluatorConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  const apiKey = getEnv("EVALUATOR_API_KEY") || getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  const baseUrl =
    getEnv("EVALUATOR_BASE_URL") ||
    getEnv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1");
  const model =
    getEnv("EVALUATOR_MODEL") ||
    getEnv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514");
  return { apiKey, baseUrl, model };
}

async function callEvaluator(
  prompt: string,
  config: { apiKey: string; baseUrl: string; model: string }
): Promise<string> {
  // Native Anthropic Messages API vs OpenAI-compatible gateway
  if (config.baseUrl.includes("anthropic.com")) {
    return chatCompletion(
      `${config.baseUrl}/messages`,
      {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      {
        model: config.model,
        max_tokens: 2048,
        system: EVALUATOR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }
    );
  }
  // OpenAI-compatible (aicredits, OpenRouter, Groq, etc.)
  return chatCompletion(
    `${config.baseUrl}/chat/completions`,
    { Authorization: `Bearer ${config.apiKey}` },
    {
      model: config.model,
      messages: [
        { role: "system", content: EVALUATOR_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }
  );
}

export async function synthesizeFinalAnswer(
  question: string,
  responses: ModelResponse[]
): Promise<SynthesisResult> {
  const prompt = buildEvaluatorPrompt(question, responses);
  const providers = createProviders();

  // Prefer dedicated evaluator (EVALUATOR_* env, shown as Claude in UI) — this is
  // separate from the three answer cards. The Claude card keeps its own model
  // (nex-agi/nex-n2-mini), while the synthesis step can use a different model
  // behind the same Claude branding.
  const evalConfig = getEvaluatorConfig();
  const hasAnyProvider = evalConfig !== null || providers.some((p) => p.config);

  // Mock synthesis when no real keys are configured.
  if (!hasAnyProvider) {
    return mockSynthesis(question, responses);
  }

  // 1) Try dedicated evaluator first (always displayed as "Claude" in the UI)
  if (evalConfig) {
    try {
      const raw = await callEvaluator(prompt, evalConfig);
      const { reasoning, answer } = parseEvaluatorOutput(raw);
      return { evaluator: "Claude", reasoning, answer };
    } catch {
      // fall through to per-provider fallback
    }
  }

  // 2) Fallback — try the three answer providers in priority order
  const order = ["anthropic", "openai", "gemini"];
  const sorted = [...providers].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );

  let lastError: Error | null = null;
  for (const provider of sorted) {
    if (!provider.config) continue;
    try {
      const raw = await provider.call(
        [{ role: "user", content: prompt }],
        EVALUATOR_SYSTEM_PROMPT
      );
      const { reasoning, answer } = parseEvaluatorOutput(raw);
      return { evaluator: provider.displayName, reasoning, answer };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown error");
    }
  }

  throw lastError ?? new Error("All evaluator providers failed");
}

function mockSynthesis(
  question: string,
  responses: ModelResponse[]
): SynthesisResult {
  const candidates = responses.filter((r) => r.answer);
  const names = candidates.map((c) => c.displayName).join(", ");
  return {
    evaluator: "Evaluator (mock mode)",
    reasoning: [
      `Compared ${candidates.length} candidate answers (${names}).`,
      `All models agreed on the core conclusion, so it is kept with high confidence.`,
      `The clearest explanation came from ${candidates[0]?.displayName ?? "the candidates"}; supporting details from the others were merged in.`,
      `No contradictions required removal. (Mock mode — add API keys for real synthesis.)`,
    ].join("\n"),
    answer: [
      `**Final answer (synthesized from ${candidates.length} model responses)**`,
      ``,
      ...candidates.map(
        (c, i) =>
          `${i + 1}. Strongest point from **${c.displayName}**: ${
            c.answer.split("\n").find((l) => l.trim() && !l.startsWith("[") && !l.startsWith("#"))?.trim() ?? "(see candidate card)"
          }`
      ),
      ``,
      `Question addressed: "${question}"`,
    ].join("\n"),
  };
}
