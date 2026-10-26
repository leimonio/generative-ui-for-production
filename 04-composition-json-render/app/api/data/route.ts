import { dashboardData } from "@/lib/dashboard-data";

// Refresh hits this: fresh figures, same spec. Demo shortcut: role from the
// query; a real app takes it from the session.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const role = q.get("role") === "admin" ? "admin" : "viewer";
  return Response.json(dashboardData(role, Number(q.get("tick") ?? 0)));
}
