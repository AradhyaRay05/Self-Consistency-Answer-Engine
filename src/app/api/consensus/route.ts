import { NextResponse } from "next/server";
import { synthesizeFinalAnswer } from "@/lib/evaluator";
import type { ModelResponse } from "@/lib/types";

export const maxDuration = 90;

export async function POST(request: Request) {
  let body: { question?: string; responses?: ModelResponse[] };
  try {
    body = (await request.json()) as { question?: string; responses?: ModelResponse[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const question = body.question?.trim() ?? "";
  const responses = body.responses ?? [];

  if (!question || responses.length === 0) {
    return NextResponse.json({ error: "Question and model responses are required." }, { status: 400 });
  }

  try {
    const synthesis = await synthesizeFinalAnswer(question, responses);
    return NextResponse.json({ synthesis });
  } catch (err) {
    return NextResponse.json(
      { error: `Synthesis failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 502 }
    );
  }
}
