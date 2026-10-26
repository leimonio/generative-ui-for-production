// Source: 04-composition-json-render/scripts/measure.mts (MODE=copy vs default ref mode) and samples/admin-dashboard.trimmed.jsonl
// Left: the model was given the 30 orders and copied them in. Right: a pointer the host fills.
import type { UIElement } from "@json-render/core";

export const copied: UIElement = {
  type: "Table",
  props: {
    columns: ["Order", "Customer", "Email", "Region", "Amount", "Margin", "Status"],
    rows: [
      ["1001", "Alice Moreau", "alice@moreau.example", "Europe", "$100.00", "18%", "paid"],
      ["1002", "Bob Lindqvist", "bob@lindqvist.example", "US", "$237.37", "25%", "paid"],
      // …28 more rows, every amount retyped by the model
    ],
  },
};

export const byReference: UIElement = {
  type: "Table",
  props: { columns: { $state: "/data/orderColumns" }, rows: { $state: "/data/orders" } },
};
