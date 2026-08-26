# Self-Consistency Answer Engine — GenAI with JS 2026

A **UI-based** GenAI web app that implements the **self-consistency** technique: the same user prompt is sent to three AI models in parallel, then a final evaluator model compares all responses, keeps the strongest parts of each, and synthesizes one refined answer that is better than any single model's output.

> **Submission**
> - Live demo: `https://your-vercel-url.vercel.app` _(replace after `npx vercel` deploy)_
> - GitHub repo: `https://github.com/<your-username>/self-consistency-answer-engine`

## Whether CLI or UI

**UI-based web app** — Next.js (App Router) + TypeScript + Tailwind CSS. ChatHub-style layout: sidebar with chat history, `Compare` / `Focus` toggle, side-by-side model cards, bottom composer with `Message 3 models…` + `Generate Consensus` flow. Deploys as a static Next.js app to Vercel.

## Which models / providers

| Card in UI        | Slot env vars                          | Default direct API | Configured in this repo (gateway) |
| ----------------- | -------------------------------------- | ------------------ | --------------------------------- |
| **ChatGPT**       | `OPENAI_API_KEY` / `BASE_URL` / `MODEL` | `api.openai.com/v1` / `gpt-4o` | Groq `openai/gpt-oss-120b` @ `api.groq.com/openai/v1` |
| **Claude**        | `ANTHROPIC_API_KEY` / `BASE_URL` / `MODEL` | `api.anthropic.com/v1` / `claude-sonnet-4-20250514` | `nex-agi/nex-n2-mini` @ `aicredits.in/v1` (OpenAI-compatible) |
| **Gemini**        | `GEMINI_API_KEY` / `BASE_URL` / `MODEL` | `generativelanguage.googleapis.com` / `gemini-2.0-flash` | `google/gemini-2.5-flash-lite` @ `aicredits.in/v1` |
| **Evaluator**     | prefers the Claude slot                | — | `Claude` (`nex-agi/nex-n2-mini`) |

The UI branding stays ChatGPT / Claude / Gemini regardless of the underlying gateway — achieved by making every slot's **protocol auto-detect**: if `BASE_URL` points at `anthropic.com` or `generativelanguage` the native API is used, otherwise an OpenAI-compatible `POST /chat/completions` call is made (`src/lib/providers/index.ts:32`, `src/lib/providers/base.ts:16`). Real brand logos are in `public/logos/` and rendered in `src/components/ModelAvatars.tsx`.

## How the self-consistency flow is implemented

```
User question (bottom composer)
        │
        ▼
┌─────────────────────────────────┐
│  Phase 1 — POST /api/ask        │   ChatGPT ──► answer A
│  One request per model, each     │   Claude  ──► answer B   (independent —
│  card updates as soon as its     │   Gemini  ──► answer C    skeletons in
│  model responds (pending per-    │                         ModelCard.tsx)
│  card, fetch with modelId)      │
└─────────────────────────────────┘
        │ user clicks "Generate Consensus"
        ▼
┌─────────────────────────────────┐
│  Phase 2 — POST /api/consensus  │  Evaluator (Claude) prompt:
│  src/lib/evaluator.ts:8         │  REASONING + FINAL ANSWER
│  Compares candidates, finds     │  — keeps agreements (high confidence),
│  agreements/conflicts, keeps    │    discards weak/contradictory content,
│  strongest parts of each        │    synthesizes one refined answer
└─────────────────────────────────┘
        │
        ▼
  Final synthesized answer (never a verbatim copy) — shown in a
  violet consensus panel (Compare) and full-width in Focus mode
  with collapsible "How this answer was synthesized" reasoning.
```

Key orchestration details (`src/app/api/ask/route.ts`, `src/app/api/consensus/route.ts`, `src/app/page.tsx:61`):

- **Parallel** per-model fetches with `Promise.allSettled` — one model failing never blocks the others; each `ModelCard` shows its own `success` / `error` / `mock` badge + latency.
- **Timeouts** via `AbortController` (60s per model, 60–90s for consensus) in `src/lib/providers/base.ts:16`.
- **Mock mode** when a key is missing — deterministic simulated answers labeled `mock`, so the full flow demos without keys.
- **History** in `localStorage` (key `scae-history`), grouped by Today/Yesterday/date, searchable, selectable from the sidebar.

## Project structure

```
src/
  app/
    api/ask/route.ts        # Phase 1 — parallel model calls
    api/consensus/route.ts  # Phase 2 — evaluator synthesis
    page.tsx                # ChatHub UI, Compare/Focus, independent card updates
    layout.tsx              # Light theme, Geist fonts
  components/
    ModelCard.tsx           # Separate card per model, real logos, actions
    ModelAvatars.tsx        # Real ChatGPT/Claude/Gemini logos from public/logos
    Sidebar.tsx             # History, search, new chat — all live
    icons.tsx
  lib/
    providers/              # OpenAI-compatible + native Anthropic/Gemini adapters
    evaluator.ts            # Synthesis prompt + mockSynthesis fallback
public/logos/               # Real brand SVGs
```

## Configuration — .env is never pushed

`.env*` is ignored (see `.gitignore:33` — `.env`, `.env.local`, `.env.*.local` ignored, `!.env.example` allowed). **Real keys live only in `.env.local`** (gitignored). **`.env.example` has no keys** and is safe to commit — it documents the shape and gateway examples.

```bash
cp .env.example .env.local
# then fill in keys in .env.local
```

## Run locally

```bash
npm install
npm run dev -- --port 3001   # http://localhost:3001 (3000 often busy)
```

Build / lint:

```bash
npm run build
npm run lint
```

## Deploy

```bash
npx vercel              # or connect the GitHub repo to Vercel
```

Add the same env vars in Vercel → Project → Settings → Environment Variables (or use `.env.local` locally).

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Zero-dependency `fetch` provider adapters (OpenAI, Anthropic Messages, Google Generative Language + OpenAI-compatible gateway auto-detect)
