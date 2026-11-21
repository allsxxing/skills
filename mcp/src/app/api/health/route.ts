// /api/health: open this in a browser to see whether the server, the registry feed and the
// submission queue are alive, and which connection URLs this deployment serves. No key needed.
import { SSE_AVAILABLE } from "@/lib/handler";
import { dispatchTokenHealth, pending, queueHealth } from "@/lib/queue";
import { REPO, loadBundle } from "@/lib/registry";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const started = Date.now();
  const [registry, storage, queue, intake] = await Promise.all([
    loadBundle().then(
      ({ bundle, source }) => ({
        ok: true,
        source,
        generated: bundle.generated,
        skills: Object.keys(bundle.skills).length,
        platforms: bundle.platforms,
      }),
      (e: Error) => ({ ok: false, error: e.message }),
    ),
    queueHealth(),
    pending().then((p) => p.length, () => null),
    dispatchTokenHealth(),
  ]);

  const body = {
    service: "allsxxing-skills",
    version: "1.1.0",
    status: registry.ok && storage === "ready" ? "ok" : "degraded",
    checked_in_ms: Date.now() - started,
    registry,
    queue: { storage, pending: queue },
    intake,
    endpoints: {
      streamable_http: "/api/mcp",
      key_in_path: "/api/mcp/k/<write-key>",
      chatgpt: "/api/chatgpt",
      legacy_sse: SSE_AVAILABLE ? "/api/sse" : "disabled (set REDIS_URL or KV_URL)",
      queue_json: "/api/queue",
    },
    repo: `https://github.com/${REPO}`,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });
}
