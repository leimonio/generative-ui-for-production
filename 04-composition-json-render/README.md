# 04 — Composition: a catalog on json-render, gated per role

A catalog of shadcn/ui components (Section, Card, StatTile, Table, Button,
Badge, plus the dashboard pieces) on
[Vercel Labs' json-render](https://github.com/vercel-labs/json-render). The
model composes a whole dashboard from it; the host owns the data and checks
every line the model sends against what the user's role is allowed.

## Run it

```bash
cd 04-composition-json-render
npm install
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local`. Open http://localhost:3000, click
Generate UI, watch nodes appear before the model has finished. Click
**Refresh**: the host refetches `/api/data` and every tile and row changes
without the spec changing.

Needs React 19 (`@json-render/react` peer dep is `^19.2.3`) and zod 4.

## What you would hand-roll without the library

| Concern | Without it | here |
|---|---|---|
| Wire format | A nested tree schema, which the model has to emit whole and which is awkward to stream | Flat `{ root, elements: { id: { type, props, children: [ids] } } }`. Non-recursive by construction |
| Schema → prompt | Hand-written `SYSTEM_PROMPT` | `catalog.prompt({ customRules })` generates component list, state rules, event rules |
| Delivery | One-shot `generateObject` | `streamText` → JSONL patches → `useUIStream` compiles them progressively |
| Data | Model retypes every figure into props | The host seeds `/state/data` as the first stream line (`lib/dashboard-data.ts`); props say `{ "$state": "/data/metrics/revenue/value" }`. The model gets the paths, never the values |
| Events | Your own event wiring from spec to handlers | `on.press` → catalog action → host handler (`ActionProvider`) |
| Validation | Your own schema check | `catalog.validate(spec)` available; not wired here |

Files: `lib/catalog.ts` (the grammar, eight components + five actions),
`lib/dashboard-data.ts` (what the host seeds), `lib/registry.tsx` (type →
shadcn component), `app/api/generate/route.ts` (seed + prompt + stream),
`app/api/data/route.ts` (what Refresh fetches), `app/page.tsx` (render +
action handlers). `samples/` holds a real streamed spec.

## What the library does not do for you

- **Which catalog this user gets.** `defineCatalog` is static. Resolving the
  palette per request is yours to build. This repo's version is the gate in
  `lib/catalog.ts`, acting in three places (components, actions, data), each
  with two halves:
  0. **Allow-list:** `ALLOWED[role]` lists the components, actions and
     `$state` paths each role may have. Not a deny-list: a component added
     to the catalog later is offered to nobody until a role lists it.
  1. **Hide:** `resolveCatalog(role)` keeps only the role's listed component
     keys (viewer: no `ApprovalsPanel`, no `Toolbar`) and action keys (and
     the schema's built-in state actions) before `defineCatalog`; `dashboardData(role)`
     shapes the seed (viewer: orders tile only, no margin column, masked
     email, Europe rows, "Showing: Europe" chip). Not enough on its own: the
     model still invents tiles for figures it was never given.
  2. **Enforce:** the route checks every JSONL patch line with
     `isPatchAllowed` and drops any element whose `type` or `action` isn't
     on the role's list, any `$state` path that isn't both listed and
     seeded, and any `/state` patch.
  Neither one authorises a mutation; do that server-side when it fires.
  (This demo has no mutation endpoint: the action handlers are no-ops.)
  `scripts/seam.test.mts` (the gate's test) pins all of it (`npx -y tsx --test scripts/seam.test.mts`).
- **The opener.** `/three` renders one prompt three ways, all on
  gpt-5.4-mini: the model writing the whole page itself (`app/api/freeform`,
  a fresh HTML document per request with the admin seed in the prompt, in an
  `<iframe sandbox="allow-scripts" srcdoc>`; "Run again" for a second run),
  design system as admin, design system as viewer.
- **Who owns the data.** Here the host does: `/state/data` is seeded before
  the model's first line, the prompt lists paths not values, and any `/state`
  patch the model emits is dropped. Measured on 30 orders, N=20: by reference
  553 output tokens / 5.3s; the model copying the rows 1,709 tokens / 17.8s
  and 2 of 20 runs lost amounts.
- **Drift.** Valid ≠ same. Nothing here bounds how differently two runs lay
  out the same request.
- **Appropriateness tests.** `validate()` says conformant, not right.

## Measure it

```bash
npx -y tsx scripts/measure.mts 20                         # host-seeded (the demo), per role
MODE=copy ROWS=30 ROLES=admin npx -y tsx scripts/measure.mts 20  # the "before": model copies the rows
DUMP=samples/admin-dashboard.jsonl npx -y tsx scripts/measure.mts 1  # save a real stream
```

## Status

`@json-render/core` / `@json-render/react` 0.21.0, pre-1.0, API churn
expected (0.20 broke custom action bridges). `experimental_composeSpec` (Jev)
not used.
