import { APPROVALS, METRICS, ORDERS, maskEmail, money } from "./data";

export type Role = "admin" | "viewer";

// What the host seeds into /state/data before the model says a word (D4:
// host-seeded). The model only ever emits $state paths into this shape; it
// never sees or writes the figures. `tick` is what Refresh bumps: the data
// changes, the spec does not.
//
// The gate's third place, data: shaped per role here, by the host. The viewer
// gets orders only (no revenue, no margin), no margin column, masked email,
// rows scoped to Europe, and the scope chip text. The model cannot show what it
// was never given.
export function dashboardData(role: Role = "admin", tick = 0) {
  const k = METRICS.this_month;
  const f = 1 + 0.02 * tick; // ponytail: deterministic drift per refresh, no backend
  const orders = { label: k.orders.label, value: Math.round(3214 * f).toLocaleString("en-US"), trend: "up" };
  if (role === "viewer") {
    return {
      scope: "Showing: Europe",
      metrics: { orders },
      orderColumns: ["Order", "Customer", "Email", "Region", "Amount", "Status"],
      orders: ORDERS.filter((o) => o.region === "Europe").map((o) => [o.id, o.customer, maskEmail(o.email), o.region, money(o.amount * f), o.status]),
    };
  }
  return {
    scope: "All regions",
    metrics: {
      revenue: { label: k.revenue.label, value: `$${(1.2 * f).toFixed(2)}M`, trend: "up" },
      margin: { label: k.margin.label, value: `${(28.9 + tick * 0.3).toFixed(1)}%`, trend: tick % 2 ? "down" : "up" },
      orders,
    },
    orderColumns: ["Order", "Customer", "Email", "Region", "Amount", "Margin", "Status"],
    orders: ORDERS.map((o) => [o.id, o.customer, o.email, o.region, money(o.amount * f), `${o.margin}%`, o.status]),
    approvals: APPROVALS.map((a) => ({ ...a, amount: money(a.amount) })),
  };
}

export type DashboardData = ReturnType<typeof dashboardData>;

// The one JSONL line the host streams first. Same patch format the model
// uses, so the client needs nothing new to apply it.
export const seedPatch = (data: DashboardData) => JSON.stringify({ op: "add", path: "/state/data", value: data });
