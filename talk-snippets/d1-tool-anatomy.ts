// Source: 01-selection-single-tool/app/api/chat/route.ts (the tool, lifted out of streamText)
import { tool } from "ai";
import { z } from "zod";
import { METRICS } from "@/lib/data";

export const showMetricTile = tool({
  // What the model reads to decide whether this is the right tool: the routing.
  description: "Show the revenue tile for a period.",
  // The only thing the model fills in.
  inputSchema: z.object({
    period: z.enum(["today", "this_week", "this_month", "this_quarter"]),
  }),
  // Where the numbers come from. The model never writes one.
  execute: async ({ period }) => METRICS[period].revenue,
});
