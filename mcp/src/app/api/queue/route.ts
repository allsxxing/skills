// Pending submissions, read by the Skill Intake GitHub Action. Public on purpose: everything here
// is committed to the public repo within minutes, and reading cannot change anything.
import { pending } from "@/lib/queue";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const items = await pending();
  return Response.json(items, { headers: { "Cache-Control": "no-store" } });
}
