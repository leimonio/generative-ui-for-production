// Source: 04-composition-json-render/scripts/measure.mts output, viewer role (composed: the kinds of lines the viewer runs produced, not one verbatim run)
// The fourth line is the one the check drops: a revenue tile, a path the viewer isn't allowed.
// On the plain prompt, nearly every viewer run invented a tile like it (revenue, profit, sales, customers).
import type { JsonPatch } from "@json-render/core";

export const stream: JsonPatch[] = [
  { op: "add", path: "/elements/page", value: { type: "Section", props: { layout: "stack" }, children: ["tiles", "orders"] } },
  { op: "add", path: "/elements/tiles", value: { type: "Section", props: { layout: "grid" }, children: ["ord", "revenue"] } },
  { op: "add", path: "/elements/ord", value: { type: "StatTile", props: { label: "Orders", value: { $state: "/data/metrics/orders/value" } } } },
  { op: "add", path: "/elements/revenue", value: { type: "StatTile", props: { label: "Revenue", value: { $state: "/data/metrics/revenue/value" } } } }, // dropped
  { op: "add", path: "/elements/orders", value: { type: "Table", props: { columns: { $state: "/data/orderColumns" }, rows: { $state: "/data/orders" } } } },
];
