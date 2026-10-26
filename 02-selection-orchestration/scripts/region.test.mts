// The d1-region-fix figures. Usage: npx -y tsx --test scripts/region.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ORDERS, REGIONS } from "../lib/data";
import { regionMetric } from "../lib/tools";

test("a region's figures come from its own orders", () => {
  const us = ORDERS.filter((o) => o.region === "US");
  const revenue = us.reduce((s, o) => s + o.amount, 0);
  assert.equal(regionMetric("revenue", "US").value, revenue.toLocaleString("en-US", { style: "currency", currency: "USD" }));
  assert.equal(regionMetric("margin", "US").value, `${(us.reduce((s, o) => s + o.amount * o.margin, 0) / revenue).toFixed(1)}%`);
  assert.equal(regionMetric("orders", "US").value, String(us.length));
});

test("the regions' revenue shares add up to the whole", () => {
  const shares = REGIONS.map((r) => parseInt(regionMetric("revenue", r).delta));
  assert.equal(shares.reduce((a, b) => a + b, 0), 100);
});
