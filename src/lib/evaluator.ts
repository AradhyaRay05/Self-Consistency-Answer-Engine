import type { ModelResponse, SynthesisResult } from "./types";
import { createProviders } from "./providers";

const EVALUATOR_SYSTEM_PROMPT = `You are an expert answer evaluator and synthesizer.

You will receive one user question and several candidate answers produced by different AI models (OpenAI, Anthropic Claude, Google Gemini).

Your job is to perform self-consistency evaluation:
1. Compare all candidate answers carefully. Identify where they agree (high-confidence facts) and where they conflict.
2. Identify the strongest parts of each answer: correct reasoning, useful detail, clarity, completeness.
3. Discard any incorrect, vague, or contradictory content.
4. Produce a final refined answer that is BETTER than any single candidate — do NOT copy any one model's response verbatim. Synthesize the best elements into one coherent, accurate, well-structured response.

Respond in exactly this format:

REASONING:
<2-4 sentences explaining which parts of each candidate you kept, which you discarded, and why>

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

export async function synthesizeFinalAnswer(
  question: string,
  responses: ModelResponse[]
): Promise<SynthesisResult> {
  const prompt = buildEvaluatorPrompt(question, responses);
  const providers = createProviders();

  // Prefer Claude as the evaluator; fall back to the first working provider.
  const order = ["anthropic", "openai", "gemini"];
  const sorted = [...providers].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );

  let lastError: Error | null = null;

  // Mock synthesis when no real keys are configured.
  if (!sorted.some((p) => p.config)) {
    return mockSynthesis(question, responses);
  }

  for (const provider of sorted) {
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
