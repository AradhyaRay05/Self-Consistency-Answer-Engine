"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, ModelResponse, SynthesisResult } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import ModelCard from "@/components/ModelCard";
import { OpenAIAvatar, ClaudeAvatar, GeminiAvatar } from "@/components/ModelAvatars";
import {
  GridIcon,
  FocusIcon,
  PlusIcon,
  MicIcon,
  SparklesIcon,
  CloseIcon,
  PanelIcon,
  ChevronDownIcon,
  SendIcon,
} from "@/components/icons";

type Mode = "compare" | "focus";
type Phase = "idle" | "collecting" | "synthesizing";

const STORAGE_KEY = "scae-history";
const MODEL_IDS = ["openai", "anthropic", "gemini"] as const;

export default function Home() {
  const [mode, setMode] = useState<Mode>("compare");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<ModelResponse | null>(null);
  const [error, setError] = useState("");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [toast, setToast] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const busy = phase !== "idle";
  const visibleModels = MODEL_IDS.filter((id) => !hidden.includes(id));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setConversations(JSON.parse(raw) as Conversation[]);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 50)));
    } catch {}
  }, [conversations]);

  const updateActive = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setPhase("collecting");
    setPending([...MODEL_IDS]);
    setError("");
    setHidden([]);

    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      // eslint-disable-next-line react-hooks/purity -- event handler, not render
      createdAt: Date.now(),
      question,
      responses: MODEL_IDS.map((modelId) => ({
        modelId,
        displayName: modelId === "openai" ? "ChatGPT" : modelId === "anthropic" ? "Claude" : "Gemini",
        status: "error" as const,
        answer: "",
        latencyMs: 0,
      })),
      synthesis: null,
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    setInput("");
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));

    // One independent request per model — each card fills in as soon as
    // its own model responds, without waiting for the slowest one.
    const settle = (
      modelId: (typeof MODEL_IDS)[number],
      data?: { responses?: ModelResponse[] },
      failed?: string
    ) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const r = data?.responses?.[0];
          return {
            ...c,
            responses: c.responses.map((old) =>
              old.modelId === modelId
                ? (r ?? {
                    ...old,
                    status: "error" as const,
                    answer: "",
                    error: failed ?? "Request failed",
                  })
                : old
            ),
          };
        })
      );
      setPending((p) => p.filter((m) => m !== modelId));
    };

    await Promise.allSettled(
      MODEL_IDS.map(async (modelId) => {
        try {
          const res = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, modelId }),
          });
          const data = (await res.json()) as { responses?: ModelResponse[]; error?: string };
          settle(modelId, data, data.error);
        } catch (err) {
          settle(modelId, undefined, err instanceof Error ? err.message : "Network error");
        }
      })
    );
    setPhase("idle");
  }

  async function generateConsensus() {
    if (!active || busy || active.synthesis) return;
    setPhase("synthesizing");
    setError("");
    try {
      const res = await fetch("/api/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: active.question, responses: active.responses }),
      });
      const data = (await res.json()) as { synthesis?: SynthesisResult; error?: string };
      if (data.synthesis) {
        updateActive(active.id, { synthesis: data.synthesis });
        setMode("compare");
      }
      if (data.error) setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPhase("idle");
    }
  }

  function newChat() {
    setActiveId(null);
    setError("");
    setHidden([]);
    setMobileSidebar(false);
  }

  function selectChat(id: string) {
    setActiveId(id);
    setHidden([]);
    setError("");
    setMobileSidebar(false);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  }

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 768px)").matches) setDesktopCollapsed((v) => !v);
    else setMobileSidebar(true);
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  return (
    <div className="flex h-screen bg-white">
      {!desktopCollapsed && (
        <Sidebar
          history={conversations}
          activeId={activeId}
          onSelect={selectChat}
          onNewChat={newChat}
          mobileOpen={mobileSidebar}
          onMobileClose={() => setMobileSidebar(false)}
          onCollapse={() => setDesktopCollapsed(true)}
          onInfo={showToast}
        />
      )}

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="absolute inset-x-0 top-0 z-10 flex items-center px-4 py-3">
          <button
            onClick={toggleSidebar}
            className={`rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 ${desktopCollapsed ? "" : "md:invisible"}`}
            aria-label="Toggle sidebar"
          >
            <PanelIcon />
          </button>
          <div className="absolute left-1/2 top-3 -translate-x-1/2">
            <div className="flex rounded-full bg-zinc-100 p-1">
              {(["compare", "focus"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    mode === m
                      ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {m === "compare" ? <GridIcon /> : <FocusIcon />}
                  {m === "compare" ? "Compare" : "Focus"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Conversation area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-52 pt-16">
          {!active ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center px-2 text-center sm:px-4">
              <h2 className="text-xl font-semibold text-zinc-800 sm:text-2xl">Ask anything</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                Type any question below — ChatGPT, Claude and Gemini will answer side by side in separate cards, then
                you can generate one consensus answer.
              </p>
              <div className="mt-6 grid w-full max-w-xl gap-2.5 text-left">
                {[
                  "Explain the difference between TCP and UDP in 2 sentences.",
                  "If a train travels 120 km in 90 minutes, what is its average speed in m/s?",
                  "What are 3 practical ways to reduce procrastination?",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => ask(ex)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>

            </div>
          ) : mode === "focus" ? (
            <FocusView synthesis={active.synthesis} generating={phase === "synthesizing"} />
          ) : (
            <>
              <div className="mb-4 flex shrink-0 justify-end">
                <div className="max-w-[75%] rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-800">
                  {active.question}
                </div>
              </div>

              <div className="grid gap-4 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-2">
                {visibleModels.map((modelId) => (
                  <div key={modelId} className="flex sm:min-w-[340px] sm:flex-1">
                    <ModelCard
                      response={active.responses.find((r) => r.modelId === modelId)}
                      loading={pending.includes(modelId)}
                      onClose={() => setHidden((h) => [...h, modelId])}
                      onExpand={() => setExpanded(active.responses.find((r) => r.modelId === modelId) ?? null)}
                    />
                  </div>
                ))}
              </div>

              {active.synthesis && (
                <section className="mt-5 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/60">
                  <header className="flex items-center justify-between border-b border-violet-100 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-violet-900">
                      <SparklesIcon /> Final Synthesized Answer
                    </span>
                    <span className="text-[11px] font-medium text-violet-500">
                      Evaluator: {active.synthesis.evaluator}
                    </span>
                  </header>
                  <div className="px-4 py-3">
                    {active.synthesis.reasoning && (
                      <details className="mb-3">
                        <summary className="cursor-pointer text-xs font-medium text-violet-500 hover:text-violet-700">
                          How this answer was synthesized
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-xs leading-relaxed text-zinc-500">
                          {active.synthesis.reasoning}
                        </p>
                      </details>
                    )}
                    <div className="space-y-1.5 text-sm leading-relaxed text-zinc-700">
                      {active.synthesis.answer.split("\n").map((line, i) =>
                        line.trim() ? (
                          <p key={i} className="whitespace-pre-wrap">
                            {line}
                          </p>
                        ) : (
                          <div key={i} className="h-2" />
                        )
                      )}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Bottom composer */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-2.5 pt-8">
          {error && (
            <div className="mx-auto mb-3 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          {phase === "synthesizing" && (
            <div className="mx-auto mb-3 flex max-w-3xl items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              Evaluator is comparing all model responses…
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          >
            {active && !active.synthesis && !busy && (
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-zinc-700">
                  <span className="text-zinc-500">
                    <SparklesIcon />
                  </span>
                  Want one combined answer from all models?
                </span>
                <button
                  type="button"
                  onClick={generateConsensus}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Generate Consensus
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <button
                type="button"
                onClick={newChat}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="New chat"
              >
                <PlusIcon />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                placeholder={busy ? "Working…" : `Message ${MODEL_IDS.length} models…`}
                maxLength={4000}
                disabled={busy}
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-medium text-zinc-900 caret-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-400 disabled:opacity-50"
              />
              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 py-1.5 pl-2 pr-2.5 text-xs text-zinc-600 hover:bg-zinc-50"
                title="Models queried in parallel"
              >
                <span className="flex -space-x-1.5">
                  <OpenAIAvatar className="h-5 w-5" />
                  <ClaudeAvatar className="h-5 w-5" />
                  <GeminiAvatar className="h-5 w-5" />
                </span>
                {MODEL_IDS.length} models
                <span className="text-zinc-400">
                  <ChevronDownIcon />
                </span>
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Voice input"
              >
                <MicIcon />
              </button>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="rounded-full bg-zinc-900 p-2 text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send"
                title="Send (Enter)"
              >
                <SendIcon />
              </button>
            </div>
          </form>
          <p className="pb-1 pt-2 text-center text-[11px] text-zinc-400">
            AI models can make mistakes. Check important information.
          </p>
        </div>

        {toast && (
          <div className="pointer-events-none fixed bottom-28 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
            {toast}
          </div>
        )}

        {/* Expanded answer modal */}
        {expanded && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setExpanded(null)}
          >
            <div
              className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-800">{expanded.displayName}</h3>
                <button
                  onClick={() => setExpanded(null)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="space-y-1.5 text-sm leading-relaxed text-zinc-700">
                {expanded.answer.split("\n").map((line, i) =>
                  line.trim() ? (
                    <p key={i} className="whitespace-pre-wrap">
                      {line}
                    </p>
                  ) : (
                    <div key={i} className="h-2" />
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FocusView({
  synthesis,
  generating,
}: {
  synthesis: SynthesisResult | null;
  generating: boolean;
}) {
  if (generating) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent" />
        Evaluator is synthesizing the best answer…
      </div>
    );
  }
  if (!synthesis) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-zinc-700">No consensus yet</p>
        <p className="mt-1 max-w-sm text-xs text-zinc-500">
          Send a question in Compare mode, then press “Generate Consensus” to let the evaluator synthesize the best
          answer from all models.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <SparklesIcon /> Final Synthesized Answer
        </h2>
        <span className="text-[11px] text-violet-500">{synthesis.evaluator}</span>
      </div>
      <div className="space-y-1.5 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 text-sm leading-relaxed text-zinc-700">
        {synthesis.answer.split("\n").map((line, i) =>
          line.trim() ? (
            <p key={i} className="whitespace-pre-wrap">
              {line}
            </p>
          ) : (
            <div key={i} className="h-2" />
          )
        )}
      </div>
      {synthesis.reasoning && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-600">
            How this answer was synthesized
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">{synthesis.reasoning}</p>
        </details>
      )}
    </div>
  );
}
