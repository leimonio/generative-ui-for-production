// Source: 03-selection-design-system/app/components.tsx vs 02-selection-orchestration/app/components.tsx (MetricTile)
// Same name, same props, same tool call. Only what the client renders changes.
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Metric = { label: string; value: string; delta: string };

// 02: plain
export function PlainMetricTile({ label, value, delta }: Metric) {
  return (
    <div className="widget">
      <div className="widget-label">{label}</div>
      <strong className="widget-value">{value}</strong> {delta}
    </div>
  );
}

// 03: design system
export function MetricTile({ label, value, delta }: Metric) {
  const up = !delta.startsWith("-");
  return (
    <Card className={up ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-rose-500"}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-4xl font-bold">{value}</span>
        <Badge className={up ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}>
          {up ? "▲" : "▼"} {delta}
        </Badge>
      </CardContent>
    </Card>
  );
}
