// Source: 04-composition-json-render/lib/catalog.ts (ALLOWED, viewer entry; built-in validateForm elided)
import type { Role } from "@/lib/catalog";

export const ALLOWED: Partial<Record<Role, { components: string[]; actions: string[]; paths: string[] }>> = {
  viewer: {
    components: ["Section", "Card", "StatTile", "Table", "Button", "Badge"],
    actions: ["export_report", "refresh_data"],
    paths: ["/data/scope", "/data/metrics/orders", "/data/orderColumns", "/data/orders"],
  },
  // Not listed = not allowed. A component shipped tomorrow is denied until someone adds it here.
};
