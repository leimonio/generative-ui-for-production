# Generative UI for Production — talk examples

The code behind the CityJS talk "Generative UI for Production": three depths,
from the model picking one tool to the model composing a whole page that each
user only gets the parts they're allowed.

| # | Folder | Depth | What it shows |
|---|---|---|---|
| 01 | [`01-selection-single-tool`](./01-selection-single-tool) | 1 | One tool, one widget. The model fills a period; the server looks up the number |
| 02 | [`02-selection-orchestration`](./02-selection-orchestration) | 1 | Four tools: the model has to route. "Margin in the US?" gets the global number until the tool takes a `region` (`TOOLS=region`) |
| 03 | [`03-selection-design-system`](./03-selection-design-system) | 1 | `02` with the widgets on shadcn/ui. Same tools, same calls; only the client's components change |
| 04 | [`04-composition-json-render`](./04-composition-json-render) | 2, 3 | The model composes a dashboard from a catalog on json-render, streamed per node. The host seeds the data, the model sends paths. A per-role allow-list and a check on every patch line. `/three` is the opener: one prompt, model-written page vs admin vs viewer |

Slides: [`slides/generative-ui-for-production-cityjs-2026.pdf`](./slides/generative-ui-for-production-cityjs-2026.pdf).
The examples were renumbered for this repo: where a slide says `02b`, read
`03`; where it says `05`, read `04`.

[`talk-snippets/`](./talk-snippets) has the code from each slide, type-checked
against these examples (`talk-snippets/check.sh`).
[`packages/talk-shell`](./packages/talk-shell) is only the page layout around
each demo.

## Run one

Each folder is a standalone app with its own dependencies.

```bash
cd 04-composition-json-render
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
npm run dev
```

All examples use `gpt-5.4-mini`. The numbers in the talk and in these READMEs
(routing counts, token counts, timings) and the stored samples in
`04-composition-json-render/samples` were measured on `gpt-4o-mini`.

## The checklist

1. One tool per widget first. A flat spec when layout matters.
2. The catalog is your design system's components, typed.
3. The host seeds the data. The model sends paths.
4. An allow-list per role: components, actions, data paths.
5. Check every patch. Re-check stored specs for whoever opens them.

## Which library

| Option | Fits when | Status |
|---|---|---|
| Tool per widget ([Vercel AI SDK](https://ai-sdk.dev), [CopilotKit](https://copilotkit.ai)) | Widgets only; a first feature | Mature |
| [json-render](https://github.com/vercel-labs/json-render) (Vercel Labs) | You own a React host and a design system | Active, pre-1.0 |
| [A2UI](https://a2ui.org) (Google + CopilotKit) | Several platforms, non-React clients | v0.9.1, v1.0 RC |

MCP Apps go the other way: someone else's UI inside your app, in a sandbox.

None of these decides what each user gets offered. That part is yours: see
`04-composition-json-render/lib/catalog.ts` (`ALLOWED`, `isPatchAllowed`).
