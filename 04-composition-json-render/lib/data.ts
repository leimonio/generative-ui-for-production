// Shared mock dataset for the dashboard demos. Copied verbatim into 01, 02, 03 and 04:
// the demos are isolated on purpose, so no shared package. Everything is
// deterministic (no Math.random) so measurements are reproducible and the
// model never has to invent a number.

export type Region = "Europe" | "US" | "Asia";
export type Period = "today" | "this_week" | "this_month" | "this_quarter";

export type Order = {
  id: string;
  customer: string;
  email: string;
  region: Region;
  amount: number; // USD
  margin: number; // percent
  status: "paid" | "pending" | "refunded";
};

export type Metric = { label: string; value: string; delta: string };

export const REGIONS: Region[] = ["Europe", "US", "Asia"];

const CUSTOMERS = ["Alice Moreau", "Bob Lindqvist", "Chen Wei", "Dana Okafor", "Eli Navarro", "Farah Haddad", "Gus Petrov", "Hana Sato", "Ivo Marques", "Jun Park"];
const STATUSES: Order["status"][] = ["paid", "paid", "pending", "paid", "refunded"];

// 30 orders, one per row of the "numbers by reference" measurement.
export const ORDERS: Order[] = Array.from({ length: 30 }, (_, i) => {
  const customer = CUSTOMERS[i % CUSTOMERS.length];
  return {
    id: String(1001 + i),
    customer,
    email: `${customer.split(" ")[0].toLowerCase()}@${customer.split(" ")[1].toLowerCase()}.example`,
    region: REGIONS[i % REGIONS.length],
    amount: ((i * 137) % 900) + 100 + ((i * 37) % 100) / 100,
    margin: 18 + ((i * 7) % 25),
    status: STATUSES[i % STATUSES.length],
  };
});

// Headline figures per period. Static on purpose: the tool/host reads them,
// the model only ever picks the period.
export const METRICS: Record<Period, { revenue: Metric; margin: Metric; orders: Metric }> = {
  today: {
    revenue: { label: "Revenue today", value: "$41.2K", delta: "+3.1%" },
    margin: { label: "Gross margin today", value: "27.4%", delta: "-0.6pt" },
    orders: { label: "Orders today", value: "112", delta: "+8" },
  },
  this_week: {
    revenue: { label: "Revenue this week", value: "$286K", delta: "+5.4%" },
    margin: { label: "Gross margin this week", value: "28.1%", delta: "+0.3pt" },
    orders: { label: "Orders this week", value: "763", delta: "+41" },
  },
  this_month: {
    revenue: { label: "Revenue this month", value: "$1.2M", delta: "+12%" },
    margin: { label: "Gross margin this month", value: "28.9%", delta: "+1.2pt" },
    orders: { label: "Orders this month", value: "3,214", delta: "+9%" },
  },
  this_quarter: {
    revenue: { label: "Revenue this quarter", value: "$3.4M", delta: "+7%" },
    margin: { label: "Gross margin this quarter", value: "27.8%", delta: "-0.4pt" },
    orders: { label: "Orders this quarter", value: "9,870", delta: "+4%" },
  },
};

// Pending items for the approvals queue (an admin-only surface).
export const APPROVALS = [
  { id: "apr-1", type: "Refund", orderId: "1004", requester: "Dana Okafor", amount: 612.11 },
  { id: "apr-2", type: "Discount 15%", orderId: "1011", requester: "Bob Lindqvist", amount: 93.45 },
  { id: "apr-3", type: "Credit note", orderId: "1019", requester: "Jun Park", amount: 420.0 },
  { id: "apr-4", type: "Refund", orderId: "1024", requester: "Eli Navarro", amount: 188.88 },
];

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// "alice@moreau.example" -> "a***@moreau.example"
export const maskEmail = (email: string) => email.replace(/^(.)[^@]*/, "$1***");
