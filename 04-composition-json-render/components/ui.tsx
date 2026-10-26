// The real, trusted design system: canonical shadcn/ui components, added via
// `npx shadcn add` (components/ui/*), not hand-rolled. The LLM never touches
// this code — it only ever picks a `type` name and fills in narrow prop
// shapes from lib/schema.ts, using shadcn's own variant vocabulary.

import { Card as ShadcnCard, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  Table as ShadcnTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { Button as ShadcnButton, type ButtonProps } from "./ui/button";
import { Badge as ShadcnBadge, type BadgeProps } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

export function Card({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <ShadcnCard>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </ShadcnCard>
  );
}

// shadcn/ui ships no dedicated "stat tile" component, so this composes one
// entirely from the same Card primitives every other node uses — no raw
// hand-styled divs, just a different arrangement of real shadcn parts.
export function StatTile({
  label,
  value,
  trend,
}: {
  label: string;
  // undefined = the bound figure hasn't streamed in yet.
  value?: string;
  trend?: "up" | "down" | "flat";
}) {
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : trend === "flat" ? "▬" : "";
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-muted-foreground";
  return (
    <ShadcnCard data-testid="stat-tile">
      <CardContent className="pt-6">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-1 h-8 w-24" />
        ) : (
          <p className="text-2xl font-semibold">
            {value} {arrow && <span className={`text-sm ${trendColor}`}>{arrow}</span>}
          </p>
        )}
      </CardContent>
    </ShadcnCard>
  );
}

// The first page of rows, like a real dashboard; the full set stays bound.
const PAGE = 8;

// rows undefined = the bound data hasn't streamed in yet: show placeholder rows.
export function Table({ columns, rows }: { columns: string[]; rows?: string[][] }) {
  return (
    <div>
      <ShadcnTable>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows
            ? rows.slice(0, PAGE).map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            : [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </ShadcnTable>
      {/* Outside the table, so it stays in view when a narrow table scrolls sideways. */}
      {rows && rows.length > PAGE && (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing {PAGE} of {rows.length}
        </p>
      )}
    </div>
  );
}

export function Button({ label, variant }: { label: string; variant?: ButtonProps["variant"] }) {
  return <ShadcnButton variant={variant}>{label}</ShadcnButton>;
}

export function Badge({ label, variant }: { label: string; variant?: BadgeProps["variant"] }) {
  return <ShadcnBadge variant={variant}>{label}</ShadcnBadge>;
}

export function ApprovalsPanel({
  title,
  items,
}: {
  title: string;
  items: { id: string; type: string; orderId: string; requester: string; amount: string }[];
}) {
  return (
    <ShadcnCard data-testid="approvals-panel">
      <CardHeader>
        <CardTitle>
          {title} <ShadcnBadge variant="secondary">{items.length}</ShadcnBadge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>
              {a.type} on #{a.orderId} <span className="text-muted-foreground">by {a.requester}</span>
            </span>
            <span className="font-medium">{a.amount}</span>
          </div>
        ))}
        {items.length === 0 && <p className="py-2 text-sm text-muted-foreground">Nothing waiting.</p>}
      </CardContent>
    </ShadcnCard>
  );
}

export function Toolbar({ children }: { children?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2" data-testid="toolbar">{children}</div>;
}

// Shown before the first renderable node arrives: the rough shape of a page
// (stat row, then a block) so the window doesn't sit empty.
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
