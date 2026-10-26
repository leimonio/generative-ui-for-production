// Source: 04-composition-json-render/lib/catalog.ts (definition, three of eight components, one action)
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    StatTile: {
      description: "One headline metric. `value` MUST be {\"$state\": \"/data/metrics/<name>/value\"}, never literals.",
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        trend: z.enum(["up", "down", "flat"]).nullable(),
      }),
    },
    Table: {
      description: "Tabular data. `columns` and `rows` MUST be $state references.",
      props: z.object({ columns: z.array(z.string()).min(1), rows: z.array(z.array(z.string())) }),
    },
    ApprovalsPanel: {
      description: "Side panel listing refunds/discounts awaiting approval.",
      props: z.object({
        title: z.string(),
        items: z.array(z.object({ id: z.string(), type: z.string(), orderId: z.string(), requester: z.string(), amount: z.string() })),
      }),
    },
  },
  actions: {
    refresh_data: { description: "Reload the figures shown on the page." },
  },
});
