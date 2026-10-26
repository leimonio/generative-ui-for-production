import { tool } from "ai";
import { z } from "zod";
import { APPROVALS, METRICS, ORDERS, REGIONS, money, type Metric, type Order, type Region } from "@/lib/data";

// One tool per dashboard widget. Same shape as 01's single tool; the only new
// thing is that the model now has to pick one. Shared by the chat route and
// scripts/route-probe.mts so the probe measures exactly what the demo offers.
const period = z.enum(["today", "this_week", "this_month", "this_quarter"]);
const region = z.enum(REGIONS as [Region, ...Region[]]);
const metric = z.enum(["revenue", "margin", "orders"]);

export const SYSTEM =
  "You are a sales dashboard assistant. When the user asks about sales data, show it with " +
  "exactly one widget tool; do not describe the data in text. Answer unrelated questions in one short sentence.";

export const tools = {
  showMetricTile: tool({
    description: "Show one headline metric tile (revenue, margin or order count) for a period.",
    inputSchema: z.object({ metric, period }),
    execute: async ({ metric, period }) => METRICS[period][metric],
  }),
  showOrdersTable: tool({
    description: "Show a table of recent orders, optionally filtered to one region or one status.",
    inputSchema: z.object({
      region: region.nullable(),
      status: z.enum(["paid", "pending", "refunded"]).nullable(),
    }),
    execute: async ({ region, status }) => ({
      columns: ["Order", "Customer", "Region", "Amount", "Status"],
      rows: ORDERS.filter((o) => (!region || o.region === region) && (!status || o.status === status))
        .slice(0, 8)
        .map((o) => [o.id, o.customer, o.region, money(o.amount), o.status]),
    }),
  }),
  showApprovalsQueue: tool({
    description: "Show the queue of refunds, discounts and credit notes waiting for a manager's approval.",
    inputSchema: z.object({}),
    execute: async () => ({ items: APPROVALS.map((a) => ({ ...a, amount: money(a.amount) })) }),
  }),
  showRegionBreakdown: tool({
    description: "Show revenue per region (Europe, US, Asia) as a bar list, for comparing regions.",
    inputSchema: z.object({}),
    execute: async () => ({
      bars: REGIONS.map((r) => {
        const total = ORDERS.filter((o) => o.region === r).reduce((s, o) => s + o.amount, 0);
        return { region: r, value: money(total), amount: total };
      }),
    }),
  }),
};

// The d1-region-fix step: the same showMetricTile with one more argument, a
// nullable region. Off by default so the region failure can still be shown;
// TOOLS=region turns it on in the chat route and in scripts/route-probe.mts.
export const toolsWithRegion = {
  ...tools,
  showMetricTile: tool({
    description: "Show one headline metric tile (revenue, margin or order count) for a period, optionally for one region.",
    inputSchema: z.object({ metric, period, region: region.nullable() }),
    execute: async ({ metric, period, region }) => (region ? regionMetric(metric, region) : METRICS[period][metric]),
  }),
};

export const activeTools = () => (process.env.TOOLS === "region" ? toolsWithRegion : tools);

// The headline figures are global, so a region's come from its orders, the
// same orders showRegionBreakdown sums. Labelled as such: they have no period.
export function regionMetric(m: z.infer<typeof metric>, r: Region): Metric {
  const revenue = (os: Order[]) => os.reduce((s, o) => s + o.amount, 0);
  const margin = (os: Order[]) => os.reduce((s, o) => s + o.amount * o.margin, 0) / revenue(os);
  const mine = ORDERS.filter((o) => o.region === r);
  if (m === "revenue")
    return { label: `Revenue, ${r} (recent orders)`, value: money(revenue(mine)), delta: `${Math.round((100 * revenue(mine)) / revenue(ORDERS))}% of total` };
  if (m === "margin") {
    const d = margin(mine) - margin(ORDERS);
    return { label: `Gross margin, ${r} (recent orders)`, value: `${margin(mine).toFixed(1)}%`, delta: `${d >= 0 ? "+" : ""}${d.toFixed(1)}pt vs all regions` };
  }
  return { label: `Orders, ${r} (recent orders)`, value: String(mine.length), delta: `of ${ORDERS.length}` };
}
