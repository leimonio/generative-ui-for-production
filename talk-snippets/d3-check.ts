// Source: 04-composition-json-render/lib/catalog.ts (isPatchAllowed, abridged: /state guard and parse errors elided)
import { getByPath } from "@json-render/core";
import { ALLOWED, isPathAllowed, type Role } from "@/lib/catalog";
import { dashboardData } from "@/lib/dashboard-data";

export function isPatchAllowed(line: string, role: Role) {
  const allow = ALLOWED[role];
  const seeded = { data: dashboardData(role) };
  let ok = true;
  const walk = (v: unknown): void => {
    if (!v || typeof v !== "object") return;
    const { type, props, action, $state } = v as Record<string, unknown>;
    if (typeof type === "string" && props !== undefined && !allow.components.includes(type)) ok = false;
    if (typeof action === "string" && !allow.actions.includes(action)) ok = false;
    if (typeof $state === "string" && (!isPathAllowed($state, role) || getByPath(seeded, $state) === undefined)) ok = false;
    Object.values(v).forEach(walk);
  };
  walk(JSON.parse(line));
  return ok; // false: the line is dropped, the element never arrives
}
