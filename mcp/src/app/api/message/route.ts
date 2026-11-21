// /api/message: the POST side of the deprecated HTTP+SSE transport, kept for clients that cannot speak Streamable HTTP.
// It holds a session open across two requests, which a stateless function cannot do alone, so
// mcp-handler stores the session in Redis. Without REDIS_URL or KV_URL the endpoint says so
// plainly instead of hanging, and the caller should use /api/mcp.
import { CORS_HEADERS, SSE_AVAILABLE, preflight, serve } from "@/lib/handler";

const UNAVAILABLE = {
  error: "sse_unavailable",
  message:
    "The legacy SSE transport needs a Redis session store. Set REDIS_URL (or KV_URL) on the Vercel project to enable it.",
  use_instead: "https://skills.allsxxing.com/api/mcp",
};

async function handle(request: Request): Promise<Response> {
  if (!SSE_AVAILABLE) {
    return new Response(JSON.stringify(UNAVAILABLE, null, 2), {
      status: 503,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  return serve(request);
}

export const OPTIONS = preflight;
export const maxDuration = 60;

export { handle as GET, handle as POST };
