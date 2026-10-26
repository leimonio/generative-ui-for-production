// Source: 02-selection-orchestration/lib/tools.ts (four tools; execute bodies elided)
import { tool } from "ai";
import { z } from "zod";
import { REGIONS, type Region } from "@/lib/data";

const period = z.enum(["today", "this_week", "this_month", "this_quarter"]);
const region = z.enum(REGIONS as [Region, ...Region[]]);
const elided = async () => ({}); // real bodies read lib/data.ts

export const tools = {
  showMetricTile: tool({
    description: "Show one headline metric tile (revenue, margin or order count) for a period.",
    inputSchema: z.object({ metric: z.enum(["revenue", "margin", "orders"]), period }),
    execute: elided,
  }),
  showOrdersTable: tool({
    description: "Show a table of recent orders, optionally filtered to one region or one status.",
    inputSchema: z.object({ region: region.nullable(), status: z.enum(["paid", "pending", "refunded"]).nullable() }),
    execute: elided,
  }),
  showApprovalsQueue: tool({
    description: "Show the queue of refunds, discounts and credit notes waiting for a manager's approval.",
    inputSchema: z.object({}),
    execute: elided,
  }),
  showRegionBreakdown: tool({
    description: "Show revenue per region (Europe, US, Asia) as a bar list, for comparing regions.",
    inputSchema: z.object({}),
    execute: elided,
  }),
};
