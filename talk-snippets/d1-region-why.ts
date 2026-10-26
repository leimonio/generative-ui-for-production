// Source: 02-selection-orchestration/lib/tools.ts (showMetricTile only)
// "How is margin looking in the US?" -> showMetricTile({ metric: "margin", period }).
// There is no region field, so the US can't be said. The model drops it silently.
import { tool } from "ai";
import { z } from "zod";
import { METRICS } from "@/lib/data";

const period = z.enum(["today", "this_week", "this_month", "this_quarter"]);

export const showMetricTile = tool({
  description: "Show one headline metric tile (revenue, margin or order count) for a period.",
  inputSchema: z.object({ metric: z.enum(["revenue", "margin", "orders"]), period }), // no region
  execute: async ({ metric, period }) => METRICS[period][metric],
});
