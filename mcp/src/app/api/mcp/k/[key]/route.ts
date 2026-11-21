// /api/mcp/k/<key>: the same server, with the write key in the path.
// Some connector forms drop or escape a ?key= query string when the URL is saved; this survives that.
import { preflight, serve } from "@/lib/handler";

type Ctx = { params: Promise<{ key: string }> };

async function handle(request: Request, ctx: Ctx): Promise<Response> {
  const { key } = await ctx.params;
  return serve(request, { pathKey: key });
}

export const OPTIONS = preflight;

export function HEAD(): Response {
  return new Response(null, { status: 200 });
}

export { handle as GET, handle as POST, handle as DELETE };
