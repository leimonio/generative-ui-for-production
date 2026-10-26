// Source: 01-selection-single-tool/app/page.tsx (the part switch inside messages.map)
import type { UIMessage } from "ai";
import { MetricTile, MetricTileSkeleton } from "@/app/MetricTile";

export function Part({ part }: { part: UIMessage["parts"][number] }) {
  if (part.type === "text") return <span>{part.text}</span>;

  if (part.type === "tool-showMetricTile") {
    if (part.state === "input-available") return <MetricTileSkeleton />;
    if (part.state === "output-available") {
      const output = part.output as { label: string; value: string; delta: string };
      return <MetricTile {...output} />;
    }
  }
  return null;
}
