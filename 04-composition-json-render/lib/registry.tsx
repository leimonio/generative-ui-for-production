"use client";

import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { ApprovalsPanel, Card, StatTile, Table, Button, Badge, Toolbar } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

// While streaming, a child whose element hasn't arrived yet renders as null;
// hold its slot with a skeleton so the layout fills in instead of jumping.
function withSkeletons(children: React.ReactNode, loading: boolean | undefined, className: string) {
  if (!loading || !Array.isArray(children)) return children;
  return children.map((c, i) => c ?? <Skeleton key={`skeleton-${i}`} className={className} />);
}

// Layout is the host's, not the model's. A 'grid' Section wraps its tiles to
// the panel's width and grows them to fill each row, so no row has an empty
// cell; any other block takes a full row, whatever the model nests it in.
const tile = "min-w-44 flex-1";
const fullRow = "basis-full min-w-0";

// The trusted side: catalog `type` -> real shadcn/ui-based component. The
// renderer resolves `{ "$state": "/data/..." }` props before calling these,
// so StatTile/Table receive plain values and never know about binding.
export const { registry } = defineRegistry(catalog, {
  components: {
    Section: ({ props, children, loading }) => (
      <section className={`${fullRow} flex flex-col gap-3`}>
        {props.heading && <h3 className="text-sm font-medium text-muted-foreground">{props.heading}</h3>}
        <div className={props.layout === "grid" ? "flex flex-wrap gap-4" : "flex flex-col gap-4"}>
          {withSkeletons(children, loading, props.layout === "grid" ? `h-24 ${tile}` : "h-24 w-full")}
        </div>
      </section>
    ),
    Card: ({ props, children, loading }) => (
      <div className={fullRow}>
        <Card title={props.title}>
          <div className="flex flex-wrap items-center gap-3">{withSkeletons(children, loading, "h-10 w-24")}</div>
        </Card>
      </div>
    ),
    // A $state binding resolves to undefined until the /state patch lands:
    // skeleton while streaming, "—" if the stream ended without it.
    StatTile: ({ props, loading }) => (
      <div className={tile}>
        <StatTile
          label={props.label}
          value={props.value != null ? String(props.value) : loading ? undefined : "—"}
          trend={props.trend ?? undefined}
        />
      </div>
    ),
    Table: ({ props, loading }) => (
      <div className={fullRow}>
        <Table columns={props.columns ?? []} rows={props.rows ?? (loading ? undefined : [])} />
      </div>
    ),
    ApprovalsPanel: ({ props }) => (
      <div className={fullRow}>
        <ApprovalsPanel title={props.title} items={props.items ?? []} />
      </div>
    ),
    Toolbar: ({ children, loading }) => (
      <div className={fullRow}>
        <Toolbar>{withSkeletons(children, loading, "h-10 w-24")}</Toolbar>
      </div>
    ),
    Button: ({ props, emit }) => (
      <span onClick={() => emit("press")}>
        <Button label={props.label} variant={props.variant ?? undefined} />
      </span>
    ),
    // The span stretches in a stack Section; the badge inside keeps its own width.
    Badge: ({ props }) => (
      <span>
        <Badge label={props.label} variant={props.variant ?? undefined} />
      </span>
    ),
  },
  // Catalog declares actions, so the registry must supply them; the page
  // overrides these via ActionProvider handlers so they can touch state.
  actions: {
    export_report: async () => {},
    refresh_data: async () => {},
    delete_orders: async () => {},
    bulk_approve: async () => {},
    inline_edit: async () => {},
  },
});
