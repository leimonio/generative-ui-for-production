import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isPatchAllowed, systemPrompt, type Role } from "@/lib/catalog";
import { dashboardData, seedPatch } from "@/lib/dashboard-data";

// No generateObject, no retry loop, no hand-written system prompt. The catalog
// generates the prompt (component list, state rules, `on` event rules) and the
// model streams JSONL patches that the client compiles into a flat spec.
//
// The gate, both halves: the prompt is built from the catalog resolved for
// this user, and every patch line is checked against it before it leaves.
// Data is host-seeded: the first line of the stream is /state/data from the
// host, the model only emits $state paths into it (and any /state patch it
// emits anyway is dropped by isPatchAllowed).
export async function POST(req: Request) {
  const { prompt, context } = await req.json();
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }
  // Demo shortcut: the role comes from the request. In a real app it comes
  // from the session, never from the client.
  const role: Role = context?.role === "admin" ? "admin" : "viewer";
  const result = streamText({
    model: openai("gpt-5.4-mini"),
    system: systemPrompt(role),
    prompt,
    // ~4k tokens of the prompt are json-render's fixed rules. OpenAI's
    // automatic caching missed every call in measurement; a stable key per
    // resolved palette got 4096/4275 tokens cached from the second call.
    providerOptions: { openai: { promptCacheKey: `genui-04-${role}` } },
  });

  // useUIStream on the client expects a raw text stream of JSONL patches.
  // Buffer to whole lines so each patch is checked once, complete.
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(seedPatch(dashboardData(role)) + "\n"));
      let buffer = "";
      const flush = (line: string) => {
        if (isPatchAllowed(line, role)) controller.enqueue(encoder.encode(line + "\n"));
      };
      for await (const chunk of result.textStream) {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(flush);
      }
      if (buffer) flush(buffer);
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
