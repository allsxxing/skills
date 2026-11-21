// One place that builds the MCP handlers and the request plumbing every endpoint shares.
//   /api/mcp              read-only, or read+write when a valid key is presented
//   /api/mcp/k/<key>      same, for apps that drop or mangle a ?key= query string
//   /api/chatgpt          adds the "search" and "fetch" tools ChatGPT connectors look for
//   /api/sse, /api/message  deprecated HTTP+SSE transport, for clients that cannot do
//                           Streamable HTTP. mcp-handler needs a Redis URL to hold those sessions.
import { createMcpHandler } from "mcp-handler";
import { classifyClient } from "@/lib/platforms";
import { recordClient, writeKeyValid } from "@/lib/queue";
import {
  READ_INSTRUCTIONS,
  WRITE_INSTRUCTIONS,
  registerChatGptTools,
  registerOnboardTool,
  registerPrompts,
  registerReadTools,
  registerWriteTools,
} from "@/tools";

const SERVER = { name: "allsxxing-skills", version: "1.1.0" };
const CONFIG = { basePath: "/api", maxDuration: 60, verboseLogs: process.env.NODE_ENV !== "production" };
const CAPS = { capabilities: { tools: {}, prompts: {} } };

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export const SSE_AVAILABLE = Boolean(process.env.REDIS_URL || process.env.KV_URL);

type Variant = "read" | "write" | "chatgpt" | "chatgpt-write";

const build = (v: Variant) => {
  const canWrite = v === "write" || v === "chatgpt-write";
  const chatgpt = v.startsWith("chatgpt");
  return createMcpHandler(
    (server) => {
      registerReadTools(server, { canWrite });
      registerOnboardTool(server, { canWrite });
      registerPrompts(server, { canWrite });
      if (chatgpt) registerChatGptTools(server);
      if (canWrite) registerWriteTools(server);
    },
    { serverInfo: SERVER, ...CAPS, instructions: canWrite ? WRITE_INSTRUCTIONS : READ_INSTRUCTIONS },
    CONFIG,
  );
};

const handlers: Record<Variant, ReturnType<typeof build>> = {
  read: build("read"),
  write: build("write"),
  chatgpt: build("chatgpt"),
  "chatgpt-write": build("chatgpt-write"),
};

/**
 * The write key presented by this request. Checked in order of how safe each place is:
 *   1. A request header, which connector UIs store encrypted and never show again. Preferred.
 *   2. A /k/<key> path segment, for apps that mangle query strings.
 *   3. A ?key= query parameter, which is the least safe because it is visible wherever the
 *      connector URL is displayed, logged or screenshotted.
 * Several header names are accepted because connector UIs differ on which ones they let you set,
 * and some reserve Authorization for their own use.
 */
const KEY_HEADERS = ["x-skills-key", "x-api-key", "x-skills-write-key-in", "skills-key"];

export function presentedKey(request: Request, pathKey?: string): string | null {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim() || null;
  for (const h of KEY_HEADERS) {
    const v = request.headers.get(h);
    if (v) return v.trim();
  }
  if (pathKey) return decodeURIComponent(pathKey).trim();
  const fromQuery = new URL(request.url).searchParams.get("key");
  return fromQuery ? fromQuery.trim() : null;
}

/**
 * Note every app that connects. A recognized AI app is logged under its platform id; anything else
 * is logged under its own slug and stays out of the registry's platform columns until it saves.
 */
async function noteClient(request: Request): Promise<void> {
  if (request.method !== "POST") return;
  try {
    const body = await request.clone().json();
    const msgs = Array.isArray(body) ? body : [body];
    const init = msgs.find((m) => m?.method === "initialize");
    if (!init) return;
    const info = init.params?.clientInfo ?? {};
    const ua = request.headers.get("user-agent") ?? undefined;
    const id = classifyClient(info.name) ?? classifyClient(ua);
    if (!id) return;
    await recordClient({
      platform: id.platform ?? id.slug,
      client_name: info.name ?? ua ?? "unknown",
      client_version: info.version,
      user_agent: ua,
    });
  } catch {
    // never block a request on bookkeeping
  }
}

export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

/** Shared entry point for every MCP endpoint. */
export async function serve(request: Request, opts: { chatgpt?: boolean; pathKey?: string } = {}): Promise<Response> {
  const tasks = noteClient(request);
  const key = presentedKey(request, opts.pathKey);
  const canWrite = Boolean(key) && (await writeKeyValid(key as string));
  const variant: Variant = opts.chatgpt ? (canWrite ? "chatgpt-write" : "chatgpt") : canWrite ? "write" : "read";

  // mcp-handler routes on the URL path and only answers on the endpoint derived from basePath.
  // Every alias (/api/chatgpt, /api/mcp/k/<key>, /api/sse) is normalized to that path here, so one
  // handler serves them all and a key in the path never reaches the transport layer.
  const url = new URL(request.url);
  const canonical = url.pathname === "/api/sse" || url.pathname === "/api/message" ? url.pathname : "/api/mcp";
  url.pathname = canonical;
  url.searchParams.delete("key");
  url.searchParams.delete("platform");

  const headers = new Headers(request.headers);
  // An app whose user-agent says nothing useful can pin its identity with ?platform=grok on the
  // connector URL. Explicit always beats sniffing.
  const pinned = new URL(request.url).searchParams.get("platform");
  if (pinned) headers.set("x-mcp-client", pinned);
  if (canWrite) headers.set("x-skills-write-key", key as string);
  else headers.delete("x-skills-write-key"); // never let a caller forge it
  for (const h of KEY_HEADERS) headers.delete(h); // the key is consumed here, not passed on
  const forwarded = new Request(url, {
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.clone().arrayBuffer() : undefined,
  });

  const response = await handlers[variant](forwarded);
  await tasks;
  return withCors(response);
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
