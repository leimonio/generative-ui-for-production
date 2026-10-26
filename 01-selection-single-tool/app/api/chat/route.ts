import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage, tool } from "ai";
import { z } from "zod";
import { METRICS } from "@/lib/data";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5.4-mini"),
    messages: await convertToModelMessages(messages),
    tools: {
      showMetricTile: tool({
        description: "Show the revenue tile for a period.",
        inputSchema: z.object({
          period: z.enum(["today", "this_week", "this_month", "this_quarter"]),
        }),
        // The model fills `period`; the figures come from the dataset, never from the model.
        execute: async ({ period }) => METRICS[period].revenue,
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
