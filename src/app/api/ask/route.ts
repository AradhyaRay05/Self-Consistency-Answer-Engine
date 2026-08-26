import { NextResponse } from "next/server";
import { createProviders, runProvider } from "@/lib/providers";
import type { AskResponse, ChatMessage, ModelId } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  let question = "";
  let modelId: ModelId | undefined;
  try {
    const body = (await request.json()) as { question?: string; modelId?: ModelId };
    question = body.question?.trim() ?? "";
    modelId = body.modelId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: "Please provide a non-empty question." }, { status: 400 });
  }
  if (question.length > 4000) {
    return NextResponse.json({ error: "Question is too long (max 4000 characters)." }, { status: 400 });
  }

  const providers = createProviders();
  const selected = modelId ? providers.filter((p) => p.id === modelId) : providers;
  if (selected.length === 0) {
    return NextResponse.json({ error: `Unknown model: ${modelId}` }, { status: 400 });
  }

  const messages: ChatMessage[] = [{ role: "user", content: question }];
  const responses = await Promise.all(selected.map((p) => runProvider(p, messages)));

  const payload: AskResponse = { responses };
  if (!modelId && !responses.some((r) => r.answer)) {
    payload.error = "All model calls failed. Check your API keys in .env.local and try again.";
    return NextResponse.json(payload, { status: 502 });
  }
  return NextResponse.json(payload);
}
