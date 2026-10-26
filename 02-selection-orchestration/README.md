# 02 — Selection: routing between several tools

Same mechanism as [`../01-selection-single-tool`](../01-selection-single-tool):
server tools with Zod `inputSchema`, a client `useChat` that switches on
`part.type`/`part.state`, real React components owning all rendering. The one
thing that changes: there are four tools, so the model has to **route**.

| Tool (`lib/tools.ts`) | Input the model fills | Widget (`app/components.tsx`) |
|---|---|---|
| `showMetricTile` | `metric` (revenue, margin, orders), `period` | `<MetricTile />` |
| `showOrdersTable` | `region`, `status` (both nullable) | `<OrdersTable />` |
| `showApprovalsQueue` | none | `<ApprovalsQueue />` |
| `showRegionBreakdown` | none | `<RegionBreakdown />` |

Every `execute()` reads from the mock dataset in `lib/data.ts`. The model
never writes a number; it picks a name off a list and fills a typed object.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 with `OPENAI_API_KEY` set and try "show me revenue
this month", "what needs my attention?", "which region is doing best?".

## The failure mode 01 cannot have

With one tool the model decides *whether* to call it and *what* to fill. With
four, it also decides *which*, and the `description` strings are the only
steering. Wrong or ambiguous picks are a property of the prompt, not of the
code, so they are measured, not asserted:

```bash
npx -y tsx scripts/route-probe.mts 10   # N runs per prompt, tool picked + args
```

Measured on `gpt-4o-mini`, N=20 per prompt (2026-10-17): "How is margin
looking in the US?" got the global margin tile 20/20, with no warning.
"What's pending?" went to the approvals queue 40/40.

## The region fix (`TOOLS=region`)

"How is margin looking in the US?" has no right answer above: `showMetricTile`
takes a `metric` and a `period`, no region, so the model shows the global
figure and says nothing about the US. The fix is one more argument, a nullable
`region` (`toolsWithRegion` in `lib/tools.ts`); a region's figures are computed
from its orders in `lib/data.ts`. It is off by default so the failure can still
be shown:

```bash
TOOLS=region npm run dev
TOOLS=region npx -y tsx scripts/route-probe.mts 20
```

With the region argument (same model, N=20): the US prompt passes
`region: "US"` 20/20, and Europe and Asia 20/20 each. The cost of the extra
argument: "What's pending?" now goes to approvals 12/20 and 14/20, the rest to
the pending-orders table.

## Contrast with 01

`01` has one tool, one component, one happy path. `02` keeps the exact same
mechanic and adds nothing structural: same `tool()` shape, same Zod schemas,
same client switch. `useChat` is typed with `InferUITools<typeof tools>` so
each `part.output` is typed by its tool.
