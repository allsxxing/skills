// /api/mcp: one URL for every AI app.
//   No key   -> read-only tools (the repo is public, so nothing here is secret).
//   With key -> read + write tools. Key comes from ?key= or "Authorization: Bearer" and is verified
//               by the database (only its hash is stored there), so no secret lives in this deployment.
// Stateless Streamable HTTP. For apps that mangle query strings, /api/mcp/k/<key> takes the key in
// the path instead.
import { preflight, serve } from "@/lib/handler";

const handle = (request: Request) => serve(request);

export const OPTIONS = preflight;

// Next derives HEAD from GET, which hangs inside mcp-handler; answer probes directly.
export function HEAD(): Response {
  return new Response(null, { status: 200 });
}

export { handle as GET, handle as POST, handle as DELETE };
