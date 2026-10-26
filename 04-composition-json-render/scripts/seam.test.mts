// The gate, tested where it leaks. Run: npx -y tsx --test scripts/seam.test.mts
// Written red first (2026-10-05): a component the viewer was never offered
// still passed isPatchAllowed and rendered, because the check only looked at
// `action`.
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { z } from "zod";
import { definition, isPatchAllowed, isPathAllowed, resolveCatalog, type Role } from "../lib/catalog";
import { dashboardData } from "../lib/dashboard-data";

const el = (type: string, extra = {}) =>
  JSON.stringify({ op: "add", path: `/elements/x`, value: { type, props: {}, children: [], ...extra } });

test("viewer catalog does not offer the admin-only components", () => {
  const names = resolveCatalog("viewer").componentNames;
  assert.ok(!names.includes("ApprovalsPanel"), "ApprovalsPanel offered to viewer");
  assert.ok(!names.includes("Toolbar"), "Toolbar offered to viewer");
  assert.ok(names.includes("Table"));
});

test("a hidden component type is dropped on the way out", () => {
  assert.equal(isPatchAllowed(el("ApprovalsPanel"), "viewer"), false);
  assert.equal(isPatchAllowed(el("Toolbar"), "viewer"), false);
  assert.equal(isPatchAllowed(el("ApprovalsPanel"), "admin"), true);
  assert.equal(isPatchAllowed(el("Table"), "viewer"), true);
});

test("a hidden action is still dropped", () => {
  assert.equal(isPatchAllowed(el("Button", { on: { press: { action: "bulk_approve" } } }), "viewer"), false);
  assert.equal(isPatchAllowed(el("Button", { on: { press: { action: "delete_orders" } } }), "viewer"), false);
  assert.equal(isPatchAllowed(el("Button", { on: { press: { action: "export_report" } } }), "viewer"), true);
});

test("the host owns state: any /state patch from the model is dropped", () => {
  assert.equal(isPatchAllowed(JSON.stringify({ op: "add", path: "/state/data/metrics", value: {} }), "admin"), false);
});

test("an element bound to data the host never seeded for this role is dropped", () => {
  const tile = (path: string) =>
    JSON.stringify({ op: "add", path: "/elements/t", value: { type: "StatTile", props: { label: "x", value: { $state: path } } } });
  assert.equal(isPatchAllowed(tile("/data/metrics/revenue/value"), "viewer"), false, "viewer has no revenue");
  assert.equal(isPatchAllowed(tile("/data/metrics/orders/value"), "viewer"), true);
  assert.equal(isPatchAllowed(tile("/data/metrics/revenue/value"), "admin"), true);
});

test("a component added to the catalog later is denied to every role until it is listed", () => {
  // What a deny-list gets wrong: someone ships a new component and every role
  // is offered it. Simulate the ship by adding it to the full catalog.
  const components = definition.components as Record<string, unknown>;
  components.RevenueChart = { description: "Revenue over time.", props: z.object({ title: z.string() }) };
  try {
    for (const role of ["admin", "viewer"] as Role[]) {
      assert.ok(!resolveCatalog(role).componentNames.includes("RevenueChart"), `RevenueChart offered to ${role}`);
      assert.equal(isPatchAllowed(el("RevenueChart"), role), false);
    }
  } finally {
    delete components.RevenueChart;
  }
});

test("every path the host seeds for a role is on that role's allow-list", () => {
  // The list and the seed are two guards; this keeps them from drifting apart.
  const leaves = (v: unknown, path: string): string[] =>
    v && typeof v === "object" ? Object.entries(v).flatMap(([k, c]) => leaves(c, `${path}/${k}`)) : [path];
  for (const role of ["admin", "viewer"] as Role[]) {
    const missing = leaves(dashboardData(role), "/data").filter((p) => !isPathAllowed(p, role));
    assert.deepEqual(missing, [], `${role} seeds paths it is not allowed`);
  }
});

test("a path on the list but not seeded, or seeded but not listed, is dropped", () => {
  const tile = (path: string) =>
    JSON.stringify({ op: "add", path: "/elements/t", value: { type: "StatTile", props: { label: "x", value: { $state: path } } } });
  assert.equal(isPatchAllowed(tile("/data/metrics/orders/nope"), "viewer"), false, "listed, not seeded");
  assert.equal(isPathAllowed("/data/metrics/margin/value", "viewer"), false, "not listed for viewer");
  assert.equal(isPathAllowed("/data/ordersX", "viewer"), false, "prefix match is per segment");
});

test("a stored admin spec opened by a viewer is checked again for the viewer", () => {
  // samples/admin-dashboard.jsonl is a saved admin run. Line 1 is the host's
  // /state seed (the host re-seeds per viewer, so it is dropped for both).
  const lines = readFileSync(new URL("../samples/admin-dashboard.jsonl", import.meta.url), "utf8").split("\n").filter(Boolean).slice(1);
  assert.ok(lines.every((l) => isPatchAllowed(l, "admin")), "the admin run passes for admin");
  const dropped = lines.filter((l) => !isPatchAllowed(l, "viewer")).join("\n");
  const kept = lines.filter((l) => isPatchAllowed(l, "viewer")).join("\n");
  for (const s of ['"ApprovalsPanel"', '"Toolbar"', "/data/metrics/revenue", "/data/metrics/margin", "/data/approvals"]) {
    assert.ok(dropped.includes(s), `${s} not dropped for viewer`);
    assert.ok(!kept.includes(s), `${s} reached the viewer`);
  }
  assert.ok(kept.includes("/data/metrics/orders"), "the viewer still gets the orders tile");
});
