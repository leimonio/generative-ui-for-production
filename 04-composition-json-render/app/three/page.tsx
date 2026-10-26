"use client";

import { useEffect, useState } from "react";
import { ActionProvider, Renderer, StateProvider, VisibilityProvider, useUIStream } from "@json-render/react";
import { registry } from "@/lib/registry";
import type { Role } from "@/lib/catalog";
import { BrowserWindow } from "@/components/BrowserWindow";
import { PageSkeleton } from "@/components/ui";

// The opener and the bookend: one prompt, three panels, one model. Left: the
// model writes the whole page itself (no catalog, no design system), in a
// sandboxed iframe; "Run again" shows it differs per run. Middle: design
// system, admin. Right: design system, viewer.
export default function Three() {
  const [prompt, setPrompt] = useState("Build me a sales dashboard.");
  const [run, setRun] = useState(0);
  // Same run, each panel at full width: the side-by-side panels are too
  // narrow to show a desktop layout. Toggling doesn't regenerate.
  const [stacked, setStacked] = useState(false);
  return (
    <div className="page shell-wide">
      <h1>Same prompt. Same model. Three different products.</h1>
      <div className="mb-6 flex gap-2">
        <input className="flex-1 rounded-md border px-3 py-2 text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          onClick={() => setRun((n) => n + 1)}
        >
          Generate all three
        </button>
        <button
          className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm"
          aria-pressed={stacked}
          onClick={() => setStacked((s) => !s)}
        >
          {stacked ? "Side by side" : "Stack panels"}
        </button>
      </div>
      <div className={stacked ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 gap-4 lg:grid-cols-3"}>
        <FreeformPanel prompt={prompt} run={run} />
        <Panel title="design system · admin" role="admin" prompt={prompt} run={run} />
        <Panel title="design system · viewer" role="viewer" prompt={prompt} run={run} />
      </div>
    </div>
  );
}

function Panel({ title, role, prompt, run }: { title: string; role: Role; prompt: string; run: number }) {
  const { spec, isStreaming, send, clear } = useUIStream({ api: "/api/generate" });
  // Fire once per click of "Generate all three". `prompt` is read at click time
  // on purpose, so typing afterwards does not regenerate.
  useEffect(() => {
    if (!run) return;
    clear();
    send(prompt, { role });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);
  return (
    <BrowserWindow testId={`panel-${role}`} title={`${title}${isStreaming ? " · streaming…" : ""}`}>
      {!spec?.elements[spec.root] ? (
        run ? <PageSkeleton /> : <p className="text-sm text-muted-foreground">Waiting for a prompt.</p>
      ) : (
        <StateProvider key={spec.root} initialState={spec.state ?? {}}>
          <VisibilityProvider>
            <ActionProvider handlers={{}}>
              <Renderer spec={spec} registry={registry} loading={isStreaming} />
            </ActionProvider>
          </VisibilityProvider>
        </StateProvider>
      )}
    </BrowserWindow>
  );
}

function FreeformPanel({ prompt, run }: { prompt: string; run: number }) {
  const [again, setAgain] = useState(0);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!run) return;
    let current = true;
    setLoading(true);
    setError("");
    fetch("/api/freeform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })
      .then(async (res) => {
        const body = await res.json();
        if (!current) return;
        if (res.ok) setHtml(body.html);
        else setError(body.error ?? `HTTP ${res.status}`);
      })
      .catch((e) => current && setError(String(e)))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, again]);
  return (
    <BrowserWindow testId="panel-freeform" title={`model-written page${loading ? " · generating…" : ""}`}>
      <div className="space-y-3">
        {error && <p className="text-sm text-destructive">Error: {error}</p>}
        {loading && !html ? (
          <PageSkeleton />
        ) : html ? (
          // No allow-same-origin: the page's scripts run, but cannot reach this app.
          <iframe sandbox="allow-scripts" srcDoc={html} title="Model-written page" className="h-[640px] w-full rounded-md border" />
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for a prompt.</p>
        )}
        <button
          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm disabled:opacity-50"
          disabled={!run || loading}
          onClick={() => setAgain((n) => n + 1)}
        >
          Run again
        </button>
      </div>
    </BrowserWindow>
  );
}
