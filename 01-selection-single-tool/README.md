# 01 — Selection: one tool (Vercel AI SDK)

Minimal demo of "generative UI": the model doesn't write markup, it calls a
typed **tool** (`showMetricTile`), and the client renders a real React
component for that tool call's typed output — not prose, not HTML from the LLM.

Ask the chat "show me revenue this month" and the model calls
`showMetricTile({ period: "this_month" })` on the server
(`app/api/chat/route.ts`). `execute()` returns `{ label, value, delta }` from
the mock dataset in `lib/data.ts`: the model fills `period` and never writes
the numbers. The client (`app/page.tsx`) switches on
`part.type === "tool-showMetricTile"`: `state === "input-available"` shows a
loading skeleton, `state === "output-available"` renders `<MetricTile />`
(`app/MetricTile.tsx`) with the tool's typed output. Ask something unrelated and
you get text, with no tool call.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and ask for revenue. `OPENAI_API_KEY` must be set.

## One tool vs. several (see `02`)

With one tool the model has two decisions: *whether* to call it, and *what
parameter values* to fill. Ask something unrelated and it answers in text.
Its only UI failure mode is a bad value, e.g. the wrong period. It cannot
pick the wrong component, because there is no other component.

`02-selection-orchestration` is the same mechanism with several dashboard-widget tools.
Nothing structural changes: the same `tool()` shape, the same Zod schemas,
the same client switch on `part.type`. What changes is that the model now
has to *route*, and wrong-tool or ambiguous-message failures appear. There
is no schema-level defence against those; the `description` strings are the
only steering. Some taxonomies (e.g. CopilotKit's) call the one-tool case a
distinct "static" tier. That is a real difference in failure modes, not in
mechanism.

## Why this matters (vs. other generative UI approaches)

This pattern is **schema-first**: the tool's `inputSchema`/output shape is
fixed at build time, and the client owns a fixed set of components keyed by
tool name. The model can only pick *which* registered component to render and
*what data* to hand it — it can never emit new markup or logic.

Contrast with **Claude Artifacts**, where the model writes fresh code (HTML/
JS/React) from scratch for every request — maximally flexible, but nothing is
statically typed or reviewable ahead of time, and there's no fixed component
contract.

Contrast with **composition from a catalog** (`04` in this repo): there, the
model doesn't call one tool per widget — it emits a spec built only from
pre-approved design-system components and props (a flat
`{ root, elements }` map on json-render), and a renderer turns it into the
page, with a per-role check on every line. That buys broader
compositional freedom than this one-tool-per-widget approach while still
disallowing arbitrary code — a middle ground between this demo's fixed
tool-to-component mapping and Artifacts' fully free code generation.
