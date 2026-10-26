// Source: 04-composition-json-render/lib/dashboard-data.ts (dashboardData, viewer branch; refresh drift elided)
import { METRICS, ORDERS, maskEmail, money } from "@/lib/data";

export function viewerData() {
  return {
    scope: "Showing: Europe",
    metrics: { orders: { label: METRICS.this_month.orders.label, value: "3,214", trend: "up" } }, // no revenue, no margin
    orderColumns: ["Order", "Customer", "Email", "Region", "Amount", "Status"], // no margin column
    orders: ORDERS.filter((o) => o.region === "Europe") // own region only
      .map((o) => [o.id, o.customer, maskEmail(o.email), o.region, money(o.amount), o.status]),
  };
}
