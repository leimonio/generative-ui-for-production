# talk-snippets

One file per code slide of the CityJS talk "Generative UI for Production"
File name = slide id. Abridged, but real: each file's first line
names the example file it comes from, and `./check.sh` type-checks it from
inside that example, so the imports and types are the example's own.

Import lines are there so the file compiles; hide them on the slide unless the
import is the point.

| Slide | File | Checked against |
|---|---|---|
| `d1-tool-anatomy` | `d1-tool-anatomy.ts` | `01` |
| `d1-client-switch` | `d1-client-switch.tsx` | `01` |
| `d1-tool-registry` | `d1-tool-registry.ts` | `02` |
| `d1-region-why` | `d1-region-why.ts` | `02` |
| `d1-region-fix` | `d1-region-fix.ts` | `02` (`toolsWithRegion`, on with `TOOLS=region`) |
| `d1-ds-swap` | `d1-ds-swap.tsx`; on the slide as `d1-ds-swap.diff` | `03` (plain tile from `02`); the `.diff` is made from the `.tsx`, not checked |
| `d2-pre-llm` | `d2-pre-llm.ts` | not checked: illustrative Adaptive Card and Ghost Platform shapes |
| `d2-catalog` | `d2-catalog.ts` | `04` |
| `d2-patches` | `d2-patches.ts` | `04` (`JsonPatch`) |
| `d2-data-source` | `d2-data-source.ts` | `04` |
| `d2-numbers-by-reference` | `d2-numbers-by-reference.ts` | `04` (`UIElement`) |
| `d3-allow-list` | `d3-allow-list.ts` | `04` |
| `d3-viewer-data` | `d3-viewer-data.ts` | `04` |
| `d3-asks-anyway` | `d3-asks-anyway.ts` | `04`; composed from viewer runs, not one verbatim run |
| `d3-check` | `d3-check.ts` | `04`; agrees with the real `isPatchAllowed` on every line of `samples/admin-dashboard.jsonl`, both roles |

```bash
./check.sh
```

`d1-ds-swap.diff` is generated from `d1-ds-swap.tsx`:

```bash
t=$(mktemp -d); awk '/^export function PlainMetricTile/,/^}/' d1-ds-swap.tsx | sed 's/PlainMetricTile/MetricTile/' > $t/a
awk '/^export function MetricTile/,/^}/' d1-ds-swap.tsx > $t/b
{ head -2 d1-ds-swap.diff; diff -u --label 02-selection-orchestration/app/components.tsx --label 03-selection-design-system/app/components.tsx $t/a $t/b; } > $t/new; mv $t/new d1-ds-swap.diff
```

Needs each example's `node_modules` (`npm install` in it).
