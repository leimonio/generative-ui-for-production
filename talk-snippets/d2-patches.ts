// Source: 04-composition-json-render/samples/admin-dashboard.trimmed.jsonl (lines 2-4 shown first, the rest on click)
// One JSONL line per patch; each adds one element by id.
import type { JsonPatch } from "@json-render/core";

export const shownFirst: JsonPatch[] = [
  { op: "add", path: "/elements/page", value: { type: "Section", props: { layout: "grid" }, children: ["revenue", "orders", "approvals", "toolbar"] } },
  { op: "add", path: "/elements/revenue", value: { type: "StatTile", props: { label: "Total Revenue", value: { $state: "/data/metrics/revenue/value" }, trend: { $state: "/data/metrics/revenue/trend" } } } },
  { op: "add", path: "/elements/orders", value: { type: "Table", props: { columns: { $state: "/data/orderColumns" }, rows: { $state: "/data/orders" } } } },
];

export const onClick: JsonPatch[] = [
  { op: "add", path: "/root", value: "page" },
  { op: "add", path: "/elements/approvals", value: { type: "ApprovalsPanel", props: { title: "Pending Approvals", items: { $state: "/data/approvals" } } } },
  { op: "add", path: "/elements/toolbar", value: { type: "Toolbar", props: {}, children: ["refresh"] } },
  { op: "add", path: "/elements/refresh", value: { type: "Button", props: { label: "Refresh Data" }, on: { press: { action: "refresh_data" } } } },
];
