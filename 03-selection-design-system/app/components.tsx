// The same four widgets as ../02-selection-orchestration/app/components.tsx,
// same names and props, built on the design system (shadcn/ui in
// components/ui). Nothing else changed: same tools, same route, same
// page.tsx switch. The model's output is identical; only what the client maps
// it to is different. The design system lives here, not in the model.
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton as UiSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function Skeleton({ label }: { label: string }) {
  return (
    <Card className="my-2 max-w-md" aria-busy="true">
      <CardContent className="space-y-2 p-4">
        <span className="sr-only">{label}</span>
        <UiSkeleton className="h-4 w-24" />
        <UiSkeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

export function MetricTile({ label, value, delta }: { label: string; value: string; delta: string }) {
  const up = !delta.startsWith("-");
  return (
    <Card
      className={cn("my-2 max-w-xs border-l-4", up ? "border-l-emerald-500" : "border-l-rose-500")}
      data-testid="metric-tile"
    >
      <CardHeader className="p-4 pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-baseline gap-3 p-4 pt-0">
        <span className="text-4xl font-bold tracking-tight">{value}</span>
        <Badge
          variant="outline"
          className={cn(
            "border-transparent",
            up ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/15 text-rose-700 dark:text-rose-400",
          )}
        >
          {/* The sign in delta already says the direction; the arrow is decoration. */}
          <span aria-hidden="true">{up ? "▲" : "▼"}</span>&nbsp;{delta}
        </Badge>
      </CardContent>
    </Card>
  );
}

export function OrdersTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <Card className="my-2">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((cell, j) => (
                <TableCell key={j}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ApprovalsQueue({
  items,
}: {
  items: { id: string; type: string; orderId: string; requester: string; amount: string }[];
}) {
  return (
    <Card className="my-2 max-w-md">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Awaiting approval ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="divide-y">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                <Badge variant="outline">{a.type}</Badge> #{a.orderId} by {a.requester}
              </span>
              <span className="font-medium">{a.amount}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RegionBreakdown({ bars }: { bars: { region: string; value: string; amount: number }[] }) {
  const max = Math.max(...bars.map((b) => b.amount));
  return (
    <Card className="my-2 max-w-md">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Revenue by region</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {bars.map((b) => (
          <div key={b.region} className="text-sm">
            <div className="flex justify-between">
              <span>{b.region}</span>
              <span className="font-medium">{b.value}</span>
            </div>
            {/* meter keeps the value available to assistive tech; the bar is decoration. */}
            <meter className="sr-only" value={b.amount} max={max} />
            <div className="h-2 rounded bg-secondary" aria-hidden="true">
              <div className="h-2 rounded bg-primary" style={{ width: `${(100 * b.amount) / max}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
