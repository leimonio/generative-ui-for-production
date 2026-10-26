// D3 probe: which widget does gpt-5.4-mini pick for each prompt, over N runs?
// Same tools and system prompt as app/api/chat/route.ts. A prompt is a
// candidate for the "wrong or ambiguous route" clip when the picks split or
// land on the wrong tool. Usage: OPENAI_API_KEY=... npx -y tsx scripts/route-probe.mts [N]
// ONLY="margin" runs only the prompts containing that text.
// TOOLS=region probes the d1-region-fix tools (showMetricTile with a region).
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM, activeTools } from "../lib/tools";

const N = Number(process.argv[2] ?? 10);
const tools = activeTools();
const FIXED = process.env.TOOLS === "region";
// [prompt, the pick a human would call right]
const PROMPTS: [string, string][] = [
  ["Show me revenue this month", "showMetricTile"],
  ["What needs my attention?", "showApprovalsQueue"],
  ["What's pending?", "ambiguous: approvals vs pending orders"],
  ["How are we doing?", "ambiguous: metric tile vs breakdown"],
  ["Show me Europe", "ambiguous: table(Europe) vs breakdown"],
  ["Show me recent orders in Europe.", 'showOrdersTable(region: "Europe")'],
  ["How is margin looking in the US?", FIXED ? 'showMetricTile(region: "US")' : "none fits: margin has no region"],
  ["How is margin looking in Europe?", FIXED ? 'showMetricTile(region: "Europe")' : "none fits: margin has no region"],
  ["How is margin looking in Asia?", FIXED ? 'showMetricTile(region: "Asia")' : "none fits: margin has no region"],
  ["Which region is doing best?", "showRegionBreakdown"],
  ["Show me the orders Dana approved", "none fits: orders have no approver"],
  ["Any refunds?", "ambiguous: approvals(refund) vs table(refunded)"],
];

const ONLY = process.env.ONLY ?? "";
console.log(`tools=${FIXED ? "region" : "default"} N=${N}`);
for (const [prompt, expected] of PROMPTS.filter(([p]) => p.includes(ONLY))) {
  const picks = new Map<string, number>();
  const args = new Map<string, number>();
  for (let i = 0; i < N; i++) {
    const { toolCalls } = await generateText({ model: openai("gpt-5.4-mini"), system: SYSTEM, prompt, tools });
    const key = toolCalls.length ? toolCalls.map((c) => c.toolName).sort().join("+") : "text";
    picks.set(key, (picks.get(key) ?? 0) + 1);
    for (const c of toolCalls) {
      const a = `${c.toolName}(${JSON.stringify(c.input)})`;
      args.set(a, (args.get(a) ?? 0) + 1);
    }
    process.stdout.write(".");
  }
  console.log(`\n"${prompt}"  expected: ${expected}`);
  for (const [k, v] of [...picks].sort((a, b) => b[1] - a[1])) console.log(`  ${v}/${N} ${k}`);
  for (const [k, v] of [...args].sort((a, b) => b[1] - a[1]).slice(0, 4)) console.log(`      ${v}x ${k}`);
}
