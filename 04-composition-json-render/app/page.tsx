"use client";

import { useRef, useState } from "react";
import {
  ActionProvider,
  Renderer,
  StateProvider,
  VisibilityProvider,
  useStateStore,
  useUIStream,
} from "@json-render/react";
import { registry } from "@/lib/registry";
import type { Role } from "@/lib/catalog";
import { BrowserWindow } from "@/components/BrowserWindow";
import { PageSkeleton } from "@/components/ui";

export default function Page() {
  const [prompt, setPrompt] = useState("Build me a sales dashboard.");
  const [role, setRole] = useState<Role>("admin");
  const { spec, isStreaming, error, send, clear } = useUIStream({ api: "/api/generate" });

  return (
    <div className="page">
      <p className="subtitle">
        Flat <code>{"{root, elements}"}</code> spec streamed as JSONL patches, rendered node by node.
        The host seeds <code>/data</code>; the model only emits <code>$state</code> paths into it. Buttons fire catalog actions.
      </p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
      {/* One prompt, two users: the server resolves a different catalog per role. */}
      <label className="text-sm">
        Signed in as{" "}
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isStreaming}>
          <option value="admin">admin (all regions, approvals, bulk actions)</option>
          <option value="viewer">viewer (Europe, orders only, read + export)</option>
        </select>
      </label>
      <button
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        onClick={() => { clear(); send(prompt, { role }); }}
        disabled={isStreaming}
      >
        {isStreaming ? "Streaming..." : "Generate UI"}
      </button>

      {error && <div className="ds-error">Error: {error.message}</div>}
      {(spec || isStreaming) && (
        <section className="result">
          <BrowserWindow title={isStreaming ? "streaming…" : "done"}>
            {!spec?.elements[spec.root] ? (
              <PageSkeleton />
            ) : (
              /* Uncontrolled state: the spec's own `state` (the /data patches
                 the model streamed) seeds the store. Providers are keyed on the
                 root id so a fresh generation re-seeds instead of merging. */
              <StateProvider key={spec.root} initialState={spec.state ?? {}}>
                <VisibilityProvider>
                  <Actions role={role}>
                    <Renderer spec={spec} registry={registry} loading={isStreaming} />
                  </Actions>
                </VisibilityProvider>
              </StateProvider>
            )}
          </BrowserWindow>
        </section>
      )}
    </div>
  );
}

// Closing the loop: a Button's `on.press` resolves to one of these. This is
// where a real app would send the event back to the model as the next turn.
// `refresh_data` refetches /data from the host; every tile and row bound to it
// re-renders without the spec changing, which is the point of binding by reference.
function Actions({ role, children }: { role: Role; children: React.ReactNode }) {
  const store = useStateStore();
  const tick = useRef(0);
  const handlers = {
    refresh_data: async () => {
      const res = await fetch(`/api/data?role=${role}&tick=${++tick.current}`);
      store.set("/data", await res.json());
    },
    export_report: () => alert("export_report fired (host-owned handler)"),
    inline_edit: () => alert("inline_edit fired (host-owned handler)"),
    bulk_approve: () => store.set("/data/approvals", []),
    // A mutation: a real app authorises this server-side, hidden button or not.
    delete_orders: () => {
      if (confirm("Delete these orders?")) store.set("/data/orders", []);
    },
  };
  return <ActionProvider handlers={handlers}>{children}</ActionProvider>;
}
