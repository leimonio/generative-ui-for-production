// The host-owned component for the showMetricTile tool. Deliberately bare: a
// box (see .widget in globals.css) so it reads as a component, not text.
// Depth 1 shows the mechanism, the design system arrives in 03 and 04.
export function MetricTile({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="widget">
      <div className="widget-label">{label}</div>
      <div>
        <strong className="widget-value">{value}</strong> {delta}
      </div>
    </div>
  );
}

export function MetricTileSkeleton() {
  return <div className="widget widget-skeleton">Loading…</div>;
}
