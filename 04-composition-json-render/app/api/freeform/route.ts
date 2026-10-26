import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { dashboardData } from "@/lib/dashboard-data";

// The opener's left panel: the model writes the whole page itself (no
// schema at all), on the same model as the other two panels
// and with the admin seed in the prompt, so its figures are the data's and
// not invented. No catalog, no design system, no check: the host's only job
// is to sandbox what comes back. Told its two widths on /three, so it looks
// as good side by side as stacked.
const SYSTEM =
  "You write a single self-contained HTML document for the user's request. " +
  "Inline all CSS in a <style> tag and all JS in a <script> tag — no " +
  "external requests, no external stylesheets or scripts. Every figure on " +
  "the page comes from the data below; do not invent numbers. The page is " +
  "shown both in a narrow window (about 400px wide) and a wide one (about " +
  "1200px): make it look like a modern SaaS dashboard (colour accents, " +
  "compact KPI cards in a row that wraps, trend arrows, status pills) and " +
  "responsive, with a layout that reflows (CSS grid/flex, no fixed widths), " +
  "no horizontal page scroll, and any table scrolling inside its own box. " +
  "List only the 8 most recent orders. Return ONLY " +
  "the raw HTML, starting with <!DOCTYPE html>, no markdown fences, no prose " +
  "before or after.\n\nData (JSON):\n" +
  JSON.stringify(dashboardData("admin"));

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }
  try {
    const { text } = await generateText({ model: openai("gpt-5.4-mini"), system: SYSTEM, prompt });
    // The model sometimes fences the document despite the instruction.
    const html = text.trim().replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");
    if (!html) return Response.json({ error: "The model returned no text." }, { status: 500 });
    return Response.json({ html });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
