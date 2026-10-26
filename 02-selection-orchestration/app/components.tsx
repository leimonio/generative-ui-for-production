// Host-owned widgets, one per tool in lib/tools.ts. The model never sees this
// file: it picks a tool name and fills its input, and the client maps the
// typed output onto one of these. Deliberately bare: a box (see .widget in
// globals.css) so each reads as a component, not text. Depth 1 shows the
// mechanism, the design system arrives in 03 and 04.
export function Skeleton({ label }: { label: string }) {
  return <div className="widget widget-skeleton">{label}</div>;
}

export function MetricTile({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="widget" data-testid="metric-tile">
      <div className="widget-label">{label}</div>
      <div>
        <strong className="widget-value">{value}</strong> {delta}
      </div>
    </div>
  );
}

export function OrdersTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="widget">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApprovalsQueue({
  items,
}: {
  items: { id: string; type: string; orderId: string; requester: string; amount: string }[];
}) {
  return (
    <div className="widget">
      <div className="widget-label">Awaiting approval ({items.length})</div>
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            {a.type} on #{a.orderId} by {a.requester}: {a.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegionBreakdown({ bars }: { bars: { region: string; value: string; amount: number }[] }) {
  const max = Math.max(...bars.map((b) => b.amount));
  return (
    <div className="widget">
      <div className="widget-label">Revenue by region</div>
      {bars.map((b) => (
        <div key={b.region}>
          {b.region}: {b.value} <meter value={b.amount} max={max} />
        </div>
      ))}
    </div>
  );
}
