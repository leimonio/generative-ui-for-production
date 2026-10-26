import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { SYSTEM, activeTools } from "@/lib/tools";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5.4-mini"),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: activeTools(),
  });

  return result.toUIMessageStreamResponse();
}
