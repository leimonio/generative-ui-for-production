// Drift + cost + RBAC harness. Same system prompt as the demo
// route, N runs per role, then:
//   drift:   strip props, compare tree shapes, histogram node types
//   cost:    input/output/cached tokens, time to first patch, total latency
//   valid:   catalog.validate (the would-be reask rate; 04 has no reask loop)
//   data:    MODE=ref (default, host seeds /data; the model emits paths only):
//              did the model write /state anyway, did every $state path exist?
//            MODE=copy (the "before": ROWS orders in the prompt, model writes /data):
//              did the amounts survive the copy?
//   rbac:    did the model bind a denied action, and did any survive the
//            route's per-line isPatchAllowed check?
// Usage: OPENAI_API_KEY=... npx -y tsx scripts/measure.mts [N]
//   MODE=copy ROWS=30 npx -y tsx scripts/measure.mts 20
//   DUMP=samples/admin.jsonl  writes the first admin run's enforced stream
import { writeFileSync } from "node:fs";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { compileSpecStream, getByPath } from "@json-render/core";
import { catalog, isPatchAllowed, resolveCatalog, systemPrompt, type Role } from "../lib/catalog";
import { dashboardData, seedPatch } from "../lib/dashboard-data";

const N = Number(process.argv[2] ?? 20);
const MODE = process.env.MODE === "copy" ? "copy" : "ref";
const ROWS = Number(process.env.ROWS ?? 30);
const DUMP = process.env.DUMP;
const SEED = dashboardData("admin");
const PROMPT = process.env.PROMPT ?? "Build me a sales dashboard.";

// The "before" arm: the same 30 orders, but handed to the model in the prompt
// and written by it into /data (the pre-Stage-3 rules).
const COPY_ORDERS = SEED.orders.slice(0, ROWS);
const COPY_PROMPT =
  `${PROMPT} Stat row: revenue (${SEED.metrics.revenue.value}, up), margin (${SEED.metrics.margin.value}, up), orders (${SEED.metrics.orders.value}, up). ` +
  `A table of these orders (${SEED.orderColumns.join(", ")}): ${COPY_ORDERS.map((o) => o.join(" ")).join("; ")}. ` +
  "A Toolbar with Refresh and Export report buttons.";
const copySystem = (role: Role) =>
  resolveCatalog(role).prompt({
    system: "You build dashboard pages from the catalog.",
    customRules: [
      "Root must be a Section. Put StatTiles in a Section with layout 'grid'.",
      "Every figure the user gives goes into state under /data first, then StatTile and Table reference it with " +
        '{"$state": "/data/..."}. Never type a number directly into props.',
      "Table.rows must reference an array of string arrays (one inner array per row) stored at exactly the path it references.",
      "Give every Button an `on.press` bound to one of the catalog actions.",
    ],
  });
// Share of given order amounts that arrived character-for-character.
const amountsIntact = (haystack: string) => COPY_ORDERS.filter((o) => haystack.includes(o[4])).length / COPY_ORDERS.length;

type El = { type: string; props?: Record<string, unknown>; children?: string[]; on?: Record<string, unknown> };
type Spec = { root?: string; elements?: Record<string, El>; state?: Record<string, unknown> };

// Props stripped: only the type tree is left, children order kept.
function shape(spec: Spec, id = spec.root ?? ""): string {
  const el = spec.elements?.[id];
  if (!el) return "?";
  const kids = (el.children ?? []).map((c) => shape(spec, c));
  return kids.length ? `${el.type}(${kids.join(",")})` : el.type;
}
// Every {"$state": path} the model emitted, and whether it resolves in the seed.
const statePaths = (text: string) => [...text.matchAll(/"\$state":"([^"]+)"/g)].map((m) => m[1]);

let dumped = false;
async function run(role: Role) {
  const t0 = performance.now();
  let firstChunk = 0;
  let text = "";
  const result = streamText({
    model: openai("gpt-5.4-mini"),
    system: MODE === "copy" ? copySystem(role) : systemPrompt(role),
    prompt: MODE === "copy" ? COPY_PROMPT : PROMPT,
    providerOptions: { openai: { promptCacheKey: `genui-04-${MODE}-${role}` } },
  });
  for await (const chunk of result.textStream) {
    if (!firstChunk) firstChunk = performance.now() - t0;
    text += chunk;
  }
  const usage = await result.usage;
  const lines = text.split("\n");
  const spec = compileSpecStream<Spec>(text);
  // What the client actually receives: the host seed, then only allowed lines.
  const enforcedText = (MODE === "ref" ? seedPatch(dashboardData(role)) + "\n" : "") + lines.filter((l) => isPatchAllowed(l, role)).join("\n");
  const enforced = compileSpecStream<Spec>(enforcedText);
  if (DUMP && role === "admin" && !dumped) {
    writeFileSync(DUMP, enforcedText);
    dumped = true;
  }
  const DESTRUCTIVE = /delete_orders|removeState|setState|pushState/;
  const els = Object.values(spec.elements ?? {});
  const delivered = Object.values(enforced.elements ?? {});
  const paths = statePaths(text);
  // Hide vs enforce, three places. "Hidden" = in the full catalog, not in this role's.
  const offered = resolveCatalog(role);
  const hiddenTypes = catalog.componentNames.filter((c) => !offered.componentNames.includes(c));
  const allActions = [...catalog.actionNames, ...(catalog.schema.builtInActions ?? []).map((a) => a.name)];
  const offeredActions = [...offered.actionNames, ...(offered.schema.builtInActions ?? []).map((a) => a.name)];
  const deniedActions = allActions.filter((a) => !offeredActions.includes(a));
  const actionsOf = (xs: El[]) => xs.flatMap((e) => [...JSON.stringify(e.on ?? {}).matchAll(/"action":"([^"]+)"/g)].map((m) => m[1]));
  return {
    role,
    ms: performance.now() - t0,
    firstMs: firstChunk,
    input: usage.inputTokens ?? 0,
    cached: usage.inputTokenDetails.cacheReadTokens ?? 0,
    output: usage.outputTokens ?? 0,
    valid: catalog.validate(enforced).success,
    shape: shape(spec),
    types: new Set(els.map((e) => e.type)),
    // ref mode
    wroteState: lines.some((l) => /"path":"\/state/.test(l)),
    badPaths: paths.filter((p) => getByPath({ data: dashboardData(role) } as Record<string, unknown>, p) === undefined),
    // A tile bound to the metric object instead of its /value leaf renders "[object Object]".
    tileToObject: els.some((e) => e.type === "StatTile" && /^\/data\/metrics\/\w+$/.test(String((e.props?.value as { $state?: string })?.$state))),
    // copy mode
    amounts: amountsIntact(JSON.stringify(spec.state ?? {})),
    deleteEmitted: els.some((e) => /delete/i.test(String(e.props?.label)) && DESTRUCTIVE.test(JSON.stringify(e.on ?? {}))),
    deleteDelivered: Object.values(enforced.elements ?? {}).some(
      (e) => /delete/i.test(String(e.props?.label)) && DESTRUCTIVE.test(JSON.stringify(e.on ?? {}))
    ),
    deniedAction: role === "viewer" ? text.match(/"action":"(delete_orders|setState|pushState|removeState)"/)?.[1] : undefined,
    // components
    hiddenTypeEmitted: els.filter((e) => hiddenTypes.includes(e.type)).map((e) => e.type),
    hiddenTypeDelivered: delivered.filter((e) => hiddenTypes.includes(e.type)).map((e) => e.type),
    // actions
    deniedActionEmitted: actionsOf(els).filter((a) => deniedActions.includes(a)),
    deniedActionDelivered: actionsOf(delivered).filter((a) => deniedActions.includes(a)),
    // data: a path the host never seeded for this role (e.g. /data/metrics/revenue for the viewer)
    unseededPathEmitted: paths.filter((p) => getByPath({ data: dashboardData(role) } as Record<string, unknown>, p) === undefined),
    unseededPathDelivered: statePaths(enforcedText).filter((p) => getByPath({ data: dashboardData(role) } as Record<string, unknown>, p) === undefined),
  };
}

const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
const pct = (n: number, d: number) => `${n}/${d} (${Math.round((100 * n) / d)}%)`;

console.log(`mode=${MODE}${MODE === "copy" ? ` rows=${ROWS}` : ""} prompt="${PROMPT}"`);
for (const role of (process.env.ROLES ?? "admin,viewer").split(",") as Role[]) {
  // Sequential on purpose: parallel runs skew latency and rate-limit.
  const runs = [];
  for (let i = 0; i < N; i++) {
    try {
      runs.push(await run(role));
    } catch (e) {
      console.error(`${role} run ${i} failed:`, String(e));
    }
    process.stdout.write(".");
  }
  const shapes = new Map<string, number>();
  for (const r of runs) shapes.set(r.shape, (shapes.get(r.shape) ?? 0) + 1);
  const typeCounts = new Map<string, number>();
  for (const r of runs) for (const t of r.types) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);

  console.log(`\n\n## ${role}, N=${runs.length}, mode=${MODE}`);
  console.log(`distinct shapes: ${shapes.size}; most common covers ${pct(Math.max(...shapes.values()), runs.length)}`);
  console.log("node types present (runs):", [...typeCounts].map(([t, c]) => `${t} ${pct(c, runs.length)}${c < runs.length / 2 ? " UNSTABLE" : ""}`).join(", "));
  console.log(`valid (catalog.validate, after enforcement): ${pct(runs.filter((r) => r.valid).length, runs.length)}`);
  if (MODE === "ref") {
    console.log(`model wrote /state anyway (dropped): ${pct(runs.filter((r) => r.wroteState).length, runs.length)}`);
    const bad = runs.filter((r) => r.badPaths.length);
    console.log(`StatTile.value bound to the metric object, not /value: ${pct(runs.filter((r) => r.tileToObject).length, runs.length)}`);
    console.log(`runs with a $state path not in the seed: ${pct(bad.length, runs.length)}${bad.length ? ` e.g. ${[...new Set(bad.flatMap((r) => r.badPaths))].slice(0, 5).join(", ")}` : ""}`);
  } else {
    const per = runs.map((r) => r.amounts);
    console.log(`ROWS=${ROWS}: all amounts intact in /data ${pct(per.filter((x) => x === 1).length, runs.length)}; avg ${Math.round(100 * per.reduce((a, b) => a + b, 0) / Math.max(per.length, 1))}% of amounts intact`);
  }
  console.log(`delete button wired to a mutation: emitted by model ${pct(runs.filter((r) => r.deleteEmitted).length, runs.length)}, delivered after enforcement ${pct(runs.filter((r) => r.deleteDelivered).length, runs.length)}`);
  if (role === "viewer") {
    const named = runs.map((r) => r.deniedAction).filter(Boolean);
    console.log(`viewer: model named a denied action ${pct(named.length, runs.length)}: ${[...new Set(named)].join(", ")}`);
  }
  if (MODE === "ref") {
    const uniq = (xs: string[]) => [...new Set(xs)].join(", ");
    const withAny = (k: "hiddenTypeEmitted" | "hiddenTypeDelivered" | "deniedActionEmitted" | "deniedActionDelivered" | "unseededPathEmitted" | "unseededPathDelivered") => runs.filter((r) => r[k].length);
    console.log(`gate/components: hidden type emitted by model ${pct(withAny("hiddenTypeEmitted").length, runs.length)} [${uniq(runs.flatMap((r) => r.hiddenTypeEmitted))}], delivered after check ${pct(withAny("hiddenTypeDelivered").length, runs.length)}`);
    console.log(`gate/actions: denied action emitted ${pct(withAny("deniedActionEmitted").length, runs.length)} [${uniq(runs.flatMap((r) => r.deniedActionEmitted))}], delivered after check ${pct(withAny("deniedActionDelivered").length, runs.length)}`);
    console.log(`gate/data: element bound to a path the host never seeded for this role: emitted ${pct(withAny("unseededPathEmitted").length, runs.length)} [${uniq(runs.flatMap((r) => r.unseededPathEmitted)).slice(0, 200)}], delivered after check ${pct(withAny("unseededPathDelivered").length, runs.length)}`);
  }
  console.log(`tokens avg: input ${avg(runs.map((r) => r.input))} (cached ${avg(runs.map((r) => r.cached))}), output ${avg(runs.map((r) => r.output))}`);
  console.log(`latency avg: first patch ${avg(runs.map((r) => r.firstMs))}ms, total ${avg(runs.map((r) => r.ms))}ms`);
  console.log("top shapes:");
  for (const [s, c] of [...shapes].sort((a, b) => b[1] - a[1]).slice(0, 3)) console.log(`  ${c}x ${s}`);
}
