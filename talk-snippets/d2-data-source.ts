// Source: 04-composition-json-render/app/api/generate/route.ts (POST, stream body abridged)
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isPatchAllowed, systemPrompt, type Role } from "@/lib/catalog";
import { dashboardData, seedPatch } from "@/lib/dashboard-data";

export async function POST(req: Request) {
  const { prompt, context } = await req.json();
  const role: Role = context?.role === "admin" ? "admin" : "viewer"; // real app: from the session
  const result = streamText({ model: openai("gpt-5.4-mini"), system: systemPrompt(role), prompt });

  const body = new ReadableStream({
    async start(controller) {
      // First line, before the model writes anything: the data, from the host.
      // In your app: your API, queried with this user's permissions.
      controller.enqueue(new TextEncoder().encode(seedPatch(dashboardData(role)) + "\n"));
      for await (const line of lines(result.textStream)) {
        if (isPatchAllowed(line, role)) controller.enqueue(new TextEncoder().encode(line + "\n"));
      }
      controller.close();
    },
  });
  return new Response(body);
}

// Whole JSONL lines out of a text stream (the route does this inline).
async function* lines(stream: AsyncIterable<string>) {
  let buffer = "";
  for await (const chunk of stream) {
    const parts = (buffer + chunk).split("\n");
    buffer = parts.pop() ?? "";
    yield* parts;
  }
  if (buffer) yield buffer;
}
