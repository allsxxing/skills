// /api/mcp: one URL for every AI app.
//   No key   -> read-only tools (the repo is public, so nothing here is secret).
//   With key -> read + write tools. Key comes from ?key= or "Authorization: Bearer" and is verified
//               by the database (only its hash is stored there), so no secret lives in this deployment.
// Stateless Streamable HTTP. basePath must match this route's parent directory.
import { createMcpHandler } from "mcp-handler";
import { detectPlatform } from "@/lib/platforms";
import { recordClient, writeKeyValid } from "@/lib/queue";
import { READ_INSTRUCTIONS, WRITE_INSTRUCTIONS, registerReadTools, registerWriteTools } from "@/tools";

const SERVER = { name: "allsxxing-skills", version: "1.0.0" };
const CONFIG = { basePath: "/api", maxDuration: 60, verboseLogs: process.env.NODE_ENV !== "production" };

const readHandler = createMcpHandler(
  (server) => registerReadTools(server),
  { serverInfo: SERVER, capabilities: { tools: {} }, instructions: READ_INSTRUCTIONS },
  CONFIG,
);

const writeHandler = createMcpHandler(
  (server) => {
    registerReadTools(server);
    registerWriteTools(server);
  },
  { serverInfo: SERVER, capabilities: { tools: {} }, instructions: WRITE_INSTRUCTIONS },
  CONFIG,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
};

function presentedKey(request: Request): string | null {
  const fromQuery = new URL(request.url).searchParams.get("key");
  if (fromQuery) return fromQuery.trim();
  const auth = request.headers.get("authorization") ?? "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
}

/** Note every app that connects, so new platforms show up in the registry without anyone asking. */
async function noteClient(request: Request): Promise<void> {
  if (request.method !== "POST") return;
  try {
    const body = await request.clone().json();
    const msgs = Array.isArray(body) ? body : [body];
    const init = msgs.find((m) => m?.method === "initialize");
    if (!init) return;
    const info = init.params?.clientInfo ?? {};
    const ua = request.headers.get("user-agent") ?? undefined;
    const platform = detectPlatform(info.name) ?? detectPlatform(ua);
    if (!platform) return;
    await recordClient({ platform, client_name: info.name ?? "unknown", client_version: info.version, user_agent: ua });
  } catch {
    // never block a request on bookkeeping
  }
}

async function handle(request: Request): Promise<Response> {
  const tasks = noteClient(request);
  const key = presentedKey(request);
  let response: Response;
  if (key && (await writeKeyValid(key))) {
    // Hand the verified key to the write tools through a request header they can read.
    const headers = new Headers(request.headers);
    headers.set("x-skills-write-key", key);
    const forwarded = new Request(request.url, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.clone().arrayBuffer() : undefined,
    });
    response = await writeHandler(forwarded);
  } else {
    response = await readHandler(request);
  }
  await tasks;
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Next derives HEAD from GET, which hangs inside mcp-handler; answer probes directly.
export function HEAD(): Response {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export { handle as GET, handle as POST };
