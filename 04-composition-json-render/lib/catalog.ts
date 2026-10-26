import { defineCatalog, getByPath } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { dashboardData, type Role } from "./dashboard-data";

// A six-component grammar (Section, Card, StatTile, Table, Button, Badge),
// declared as a json-render catalog instead of a nested Zod tree. The
// nesting (Section > Card > leaf) is no longer encoded in the schema: the
// model emits a flat { root, elements } map and expresses containment with
// `children: [ids]`. That is what makes the schema non-recursive, streamable
// per node, and patchable by id.
//
// Kept as a plain object (not inlined into defineCatalog) so resolveCatalog
// below can drop keys before the catalog is built. Exported for the gate test.
export const definition = {
  components: {
    Section: {
      description: "Page region. Layout 'grid' only for a row of StatTiles; 'stack' for everything else.",
      props: z.object({
        heading: z.string().nullable(),
        layout: z.enum(["grid", "stack"]),
      }),
      slots: ["default"],
    },
    Card: {
      description: "Titled container for StatTile/Table/Button/Badge children.",
      props: z.object({ title: z.string() }),
      slots: ["default"],
    },
    StatTile: {
      description:
        "One headline metric. `value` MUST be {\"$state\": \"/data/metrics/<name>/value\"} and `trend` {\"$state\": \"/data/metrics/<name>/trend\"}, never literals.",
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        trend: z.enum(["up", "down", "flat"]).nullable(),
      }),
    },
    Table: {
      description: "Tabular data. `columns` and `rows` MUST be $state references (/data/orderColumns, /data/orders).",
      props: z.object({
        columns: z.array(z.string()).min(1),
        rows: z.array(z.array(z.string())),
      }),
    },
    Button: {
      description: "Action button. Bind a catalog action via the top-level `on.press` field.",
      props: z.object({
        label: z.string(),
        variant: z.enum(["default", "secondary", "destructive", "outline", "ghost", "link"]).nullable(),
      }),
    },
    Badge: {
      description: "Small status label. For the data scope chip, label MUST be {\"$state\": \"/data/scope\"}.",
      props: z.object({
        label: z.string(),
        variant: z.enum(["default", "secondary", "destructive", "outline"]).nullable(),
      }),
    },
    ApprovalsPanel: {
      description: "Side panel listing refunds/discounts awaiting approval. `items` MUST be {\"$state\": \"/data/approvals\"}.",
      props: z.object({
        title: z.string(),
        items: z.array(
          z.object({ id: z.string(), type: z.string(), orderId: z.string(), requester: z.string(), amount: z.string() })
        ),
      }),
    },
    Toolbar: {
      description: "Row of action Buttons (bulk approve, inline edit, export, refresh, delete). Children are Buttons.",
      props: z.object({}),
      slots: ["default"],
    },
  },
  actions: {
    export_report: { description: "Export the current dashboard as a report." },
    refresh_data: { description: "Reload the figures shown on the page." },
    delete_orders: { description: "Permanently delete the orders shown in the table." },
    bulk_approve: { description: "Approve every item in the approvals queue." },
    inline_edit: { description: "Switch the orders table to inline editing." },
  },
};

// The full palette. The client registry is built from this: it can render
// anything, the server decides what the model is allowed to ask for.
export const catalog = defineCatalog(schema, definition);

export type DashboardSpec = typeof catalog._specType;

export type { Role };

// What each role IS allowed: components, actions and $state paths. An
// allow-list, so it fails closed: a component or action added to the catalog
// later is offered to nobody until a role lists it (a deny-list would hand it
// to everyone). In a real app this comes from your permission service,
// resolved per request. The schema's built-in state actions count too: the
// runtime executes removeState directly, so a viewer handed it can wire
// "Delete orders" to it and route around delete_orders. A path allows itself
// and everything under it.
export const ALLOWED: Record<Role, { components: string[]; actions: string[]; paths: string[] }> = {
  admin: {
    components: ["Section", "Card", "StatTile", "Table", "Button", "Badge", "ApprovalsPanel", "Toolbar"],
    actions: ["export_report", "refresh_data", "delete_orders", "bulk_approve", "inline_edit", "setState", "pushState", "removeState", "validateForm"],
    paths: ["/data/scope", "/data/metrics/revenue", "/data/metrics/margin", "/data/metrics/orders", "/data/orderColumns", "/data/orders", "/data/approvals"],
  },
  viewer: {
    components: ["Section", "Card", "StatTile", "Table", "Button", "Badge"],
    actions: ["export_report", "refresh_data", "validateForm"],
    paths: ["/data/scope", "/data/metrics/orders", "/data/orderColumns", "/data/orders"],
  },
};

export const isPathAllowed = (path: string, role: Role) =>
  ALLOWED[role].paths.some((p) => path === p || path.startsWith(p + "/"));

// The gate, half 1: resolve the palette per request. The model never sees an
// affordance the user can't use. This hides the panel and the button; it does
// not authorise anything. What a button does when pressed needs its own check
// where the action runs. This demo has none: the action handlers in
// lib/registry.tsx are client-side no-ops and there is no mutation endpoint.
export function resolveCatalog(role: Role) {
  const allow = ALLOWED[role];
  const keep = <T extends object>(obj: T, allowed: string[]) =>
    Object.fromEntries(Object.entries(obj).filter(([name]) => allowed.includes(name))) as T;
  const builtInActions = schema.builtInActions?.filter((a) => allow.actions.includes(a.name));
  return defineCatalog(
    { ...schema, builtInActions },
    { components: keep(definition.components, allow.components), actions: keep(definition.actions, allow.actions) }
  );
}

// The gate, half 2. Hiding isn't enough: the model can still name an action
// or a component type it wasn't shown. Allow-list every element `type` and
// every `action` in a streamed JSONL patch line against what this role was
// offered; false means drop the line (the element never arrives).
// State is host-owned too: the model is told never to write /state, and any
// /state patch it emits anyway is dropped so it cannot overwrite the seed. An
// element bound to a path this role is not allowed, or the host did not seed,
// is dropped as well: otherwise the viewer gets an empty "Revenue —" tile for
// a figure it was never given (measured 20/20 on the opener prompt before this
// check). Both, on purpose: the list and the seed are independent guards.
export function isPatchAllowed(line: string, role: Role) {
  const offered = resolveCatalog(role);
  const allowed = new Set([...offered.actionNames, ...(offered.schema.builtInActions ?? []).map((a) => a.name)]);
  const components = new Set(offered.componentNames);
  const seeded = { data: dashboardData(role) } as Record<string, unknown>;
  let ok = true;
  try {
    const path = (JSON.parse(line) as { path?: unknown }).path;
    if (typeof path === "string" && path.startsWith("/state")) return false;
  } catch {
    // handled below
  }
  const walk = (v: unknown): void => {
    if (!v || typeof v !== "object") return;
    const { action, type, props } = v as { action?: unknown; type?: unknown; props?: unknown };
    if (typeof action === "string" && !allowed.has(action)) ok = false;
    // An element is the object carrying `type` and `props`; state values with a
    // `type` field (e.g. an approval's "Refund") never reach here, /state is dropped above.
    if (typeof type === "string" && props !== undefined && !components.has(type)) ok = false;
    const ref = (v as { $state?: unknown }).$state;
    if (typeof ref === "string" && (!isPathAllowed(ref, role) || getByPath(seeded, ref) === undefined)) ok = false;
    Object.values(v).forEach(walk);
  };
  try {
    walk(JSON.parse(line));
  } catch {
    // Not a patch (blank line, stray prose): let the client's parser ignore it.
  }
  return ok;
}

// The shape of /state/data the host seeds for this role (see
// lib/dashboard-data.ts). The model gets the paths, never the values: a few
// dozen tokens instead of the dataset, and it cannot show a figure it was not
// given. Derived from the seed itself so prompt and data cannot drift apart.
function hostStatePaths(role: Role) {
  const data = dashboardData(role);
  const metrics = Object.keys(data.metrics).flatMap((k) => [`/data/metrics/${k}/value`, `/data/metrics/${k}/trend`]);
  return (
    `${metrics.join(", ")} (StatTile.value and StatTile.trend each reference one of these leaf paths); ` +
    "/data/orderColumns (string[]); /data/orders (string[][], one row per order); " +
    ("approvals" in data ? "/data/approvals (array of {id, type, orderId, requester, amount}); " : "") +
    "/data/scope (string)."
  );
}

// Shared by the route and scripts/measure.mts so the harness measures exactly
// what the demo sends. Built from the resolved catalog: the layout hint only
// names components this role was offered.
export function systemPrompt(role: Role) {
  const c = resolveCatalog(role);
  const has = (name: string) => c.componentNames.includes(name);
  return c.prompt({
    system: "You build dashboard pages from the catalog.",
    customRules: [
      "Root must be a Section with layout 'stack'; each of its children is one full-width row. " +
        "Put the StatTiles, and only the StatTiles, in their own Section with layout 'grid'. " +
        "Every other block (Table, ApprovalsPanel, Toolbar, Badge) is its own row of the root, never inside a grid.",
      "The host has ALREADY seeded state. NEVER emit any /state patch. Reference the host's data " +
        "with {\"$state\": path} using exactly these paths: " + hostStatePaths(role),
      "A sales dashboard is: a grid Section of StatTiles (one per /data/metrics entry), a Table of orders" +
        (has("ApprovalsPanel") ? ", an ApprovalsPanel" : "") +
        (has("Toolbar") ? ", a Toolbar of Buttons" : "") +
        ", and a Badge for the scope chip.",
      "Give every Button an `on.press` bound to one of the catalog actions. If the user asks " +
        "for a button whose action is not in the catalog, leave that button out.",
    ],
  });
}
