// Source: 02-selection-orchestration/lib/tools.ts (toolsWithRegion.showMetricTile; on with TOOLS=region)
// One argument added. "How is margin looking in the US?" can now be said.
import { tool } from "ai";
import { z } from "zod";
import { METRICS, REGIONS, type Region } from "@/lib/data";
import { regionMetric } from "@/lib/tools";

const period = z.enum(["today", "this_week", "this_month", "this_quarter"]);
const region = z.enum(REGIONS as [Region, ...Region[]]);
const input = z.object({
  metric: z.enum(["revenue", "margin", "orders"]),
  period,
  region: region.nullable(), // + one argument
});

export const showMetricTile = tool({
  description: "Show one headline metric tile (revenue, margin or order count) for a period, optionally for one region.",
  inputSchema: input,
  execute: async ({ metric, period, region }) => (region ? regionMetric(metric, region) : METRICS[period][metric]),
});

// The call the model makes now.
export const call: z.infer<typeof input> = { metric: "margin", period: "this_month", region: "US" };
