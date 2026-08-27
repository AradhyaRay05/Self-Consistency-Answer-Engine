# Self-Consistency Answer Engine — GenAI with JS 2026

A **UI-based** GenAI web app that implements the **self-consistency** technique: the same user prompt is sent to three AI models in parallel, then a final evaluator model compares all responses, keeps the strongest parts of each, and synthesizes one refined answer that is better than any single model's output.

> **Submission**
> - Live demo: `https://your-vercel-url.vercel.app` _(replace after `npx vercel` deploy)_
> - GitHub repo: `https://github.com/<your-username>/self-consistency-answer-engine`

## Whether CLI or UI

**UI-based web app** — Next.js (App Router) + TypeScript + Tailwind CSS. ChatHub-style layout: sidebar with chat history, `Compare` / `Focus` toggle, side-by-side model cards, bottom composer with `Message 3 models…` + `Generate Consensus` flow. Deploys to Vercel as a Next.js app.

## Which models / providers

Strictly per project requirements — all three providers are queried and the evaluator is Claude as specified:

| Card in UI | Model used | Provider |
| ---------- | ---------- | -------- |
| **ChatGPT** | **GPT-4.5** | OpenAI |
| **Claude** | **Claude Sonnet 4.6** | Anthropic |
| **Gemini** | **Gemini 3.6 Flash** | Google |
| **Final Synthesized Answer (evaluator)** | **Claude Haiku 4** | Anthropic — compares all three candidates and synthesizes the final output |

The UI shows ChatGPT / Claude / Gemini branding with real brand logos in `public/logos/` (`src/components/ModelAvatars.tsx`). The evaluator is always shown as `Claude` in the consensus panel, per the requirement that the final synthesis be performed by Claude.

## How the self-consistency flow is implemented

```
User question (bottom composer)
        │
        ▼
┌─────────────────────────────────┐
│  Phase 1 — POST /api/ask        │   ChatGPT (GPT-4.5) ──► answer A
│  One request per model, each     │   Claude (Sonnet 4.6) ──► answer B
│  card updates as soon as its     │   Gemini (3.6 Flash) ──► answer C
│  model responds (pending per-    │                         (ModelCard.tsx)
│  card, fetch with modelId)      │
└─────────────────────────────────┘
        │ user clicks "Generate Consensus"
        ▼
┌─────────────────────────────────┐
│  Phase 2 — POST /api/consensus  │  Evaluator: Claude Haiku 4
│  src/lib/evaluator.ts:5         │  Think step by step → REASONING
│  Compares candidates, finds     │  + FINAL ANSWER — keeps agreements
│  agreements/conflicts, keeps    │  (high confidence), discards weak/
│  strongest parts of each        │  contradictory content, synthesizes
└─────────────────────────────────┘  one refined answer
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
- **History** in `localStorage` (key `scae-history`), grouped by Today/Yesterday/date, searchable from the sidebar.

## Project structure

```
src/
  app/
    api/ask/route.ts        # Phase 1 — parallel model calls
    api/consensus/route.ts  # Phase 2 — evaluator synthesis (Claude Haiku 4)
    page.tsx                # ChatHub UI, Compare/Focus, independent card updates
    layout.tsx              # Light theme, Geist fonts
  components/
    ModelCard.tsx           # Separate card per model, real logos, actions
    ModelAvatars.tsx        # Real ChatGPT/Claude/Gemini logos
    Sidebar.tsx             # History, search, new chat — all live
    icons.tsx
  lib/
    providers/              # Provider adapters (OpenAI / Anthropic / Gemini)
    evaluator.ts            # Synthesis prompt with thinking trace
public/logos/               # Real brand SVGs
```

## Configuration — .env is never pushed

`.env` is ignored (see `.gitignore:33` — `.env`, `.env.local` ignored, `!.env.example` allowed). **Real keys live only in `.env`** (gitignored). **`.env.example` has no keys** and is safe to commit.

```bash
cp .env.example .env
# then fill in keys in .env
```

`.env.example` documents the required vars (`OPENAI_*`, `ANTHROPIC_*`, `GEMINI_*`, `EVALUATOR_*` for the Claude Haiku 4 evaluator) without any secret values.

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

Add the same env vars in Vercel → Project → Settings → Environment Variables.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Provider adapters for OpenAI / Anthropic / Google
