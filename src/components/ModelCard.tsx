"use client";

import { useState } from "react";
import type { ModelResponse } from "@/lib/types";
import { OpenAIAvatar, ClaudeAvatar, GeminiAvatar } from "./ModelAvatars";
import { CopyIcon, ThumbUpIcon, ThumbDownIcon, DownloadIcon, ExpandIcon, CloseIcon } from "./icons";

interface ModelCardProps {
  response: ModelResponse | undefined;
  loading: boolean;
  onClose: () => void;
  onExpand: () => void;
}

function Avatar({ modelId }: { modelId?: string }) {
  if (modelId === "openai") return <OpenAIAvatar />;
  if (modelId === "anthropic") return <ClaudeAvatar />;
  if (modelId === "gemini") return <GeminiAvatar />;
  return <span className="h-5 w-5 animate-pulse rounded-full bg-zinc-200" />;
}

export default function ModelCard({ response, loading, onClose, onExpand }: ModelCardProps) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  async function copy() {
    if (!response?.answer) return;
    await navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!response?.answer) return;
    const blob = new Blob([response.answer], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${response.displayName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const showActions = !loading && response && response.status !== "error";

  return (
    <section className="flex h-[480px] w-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <header className="flex shrink-0 items-center justify-between px-4 py-3.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          {loading ? (
            <span className="h-5 w-5 animate-pulse rounded-full bg-zinc-200" />
          ) : (
            <Avatar modelId={response?.modelId} />
          )}
          {loading ? "Connecting…" : (response?.displayName ?? "Model")}
        </span>
        {!loading && response && (
          <span className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={onExpand}
              className="rounded-md p-1.5 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Expand"
              title="Expand"
            >
              <ExpandIcon />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Close column"
              title="Close column"
            >
              <CloseIcon />
            </button>
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="animate-pulse space-y-2.5 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-3.5 rounded bg-zinc-100" style={{ width: `${92 - i * 14}%` }} />
            ))}
          </div>
        ) : response?.status === "error" ? (
          <p className="text-xs leading-relaxed text-red-500">{response.error}</p>
        ) : (
          <>
            <div className="space-y-1.5 pt-1 text-sm leading-relaxed text-zinc-700">
              {(response?.answer ?? "").split("\n").map((line, i) =>
                line.trim() ? (
                  <p key={i} className="whitespace-pre-wrap">
                    {line}
                  </p>
                ) : (
                  <div key={i} className="h-2" />
                )
              )}
            </div>
            {showActions && (
              <div className="mt-3 flex items-center gap-0.5 text-zinc-400">
                <button
                  onClick={copy}
                  className="rounded-md p-1.5 hover:bg-zinc-100 hover:text-zinc-600"
                  aria-label="Copy"
                  title={copied ? "Copied!" : "Copy"}
                >
                  <CopyIcon />
                </button>
                <button
                  onClick={() => setVote(vote === "up" ? null : "up")}
                  className={`rounded-md p-1.5 hover:bg-zinc-100 ${vote === "up" ? "text-emerald-600" : "hover:text-zinc-600"}`}
                  aria-label="Good answer"
                  title="Good answer"
                >
                  <ThumbUpIcon />
                </button>
                <button
                  onClick={() => setVote(vote === "down" ? null : "down")}
                  className={`rounded-md p-1.5 hover:bg-zinc-100 ${vote === "down" ? "text-red-500" : "hover:text-zinc-600"}`}
                  aria-label="Bad answer"
                  title="Bad answer"
                >
                  <ThumbDownIcon />
                </button>
                <button
                  onClick={download}
                  className="rounded-md p-1.5 hover:bg-zinc-100 hover:text-zinc-600"
                  aria-label="Download"
                  title="Download"
                >
                  <DownloadIcon />
                </button>
                {response.status === "mock" && (
                  <span className="ml-2 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                    mock
                  </span>
                )}
                {response.status === "success" && (
                  <span className="ml-2 text-[10px] text-zinc-300">
                    {(response.latencyMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
