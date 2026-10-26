# 03 — Selection, with a design system

[`../02-selection-orchestration`](../02-selection-orchestration) with one
change: the four widgets in `app/components.tsx` are built on shadcn/ui
(`components/ui`, Tailwind, the same slate tokens as `04`). Same tools
(`lib/tools.ts`), same route, same `page.tsx` switch, same component names
and props.

The point: the model's output does not change. It still picks `showMetricTile` and
fills `{ metric, period }`. The design system lives in what the client maps
that tool call to, not in the model.

```bash
diff ../02-selection-orchestration/app/components.tsx app/components.tsx
```

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 with `OPENAI_API_KEY` set and try "show me revenue
this month" or "what needs my attention?". Routing failures are measured in
`02` (`scripts/route-probe.mts`); the tools are the same here, including the
region fix (`TOOLS=region npm run dev`).
