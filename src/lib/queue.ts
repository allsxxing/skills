// Submission queue on Supabase (PostgREST over fetch, no SDK). Writes from any connected LLM land
// here; the Skill Intake GitHub Action pulls the queue, commits each submission into registry/,
// and records its id in registry/applied.json, which the server reads to hide applied rows, so no
// shared secret is needed between GitHub and the server.
//
// All writes go through SECURITY DEFINER functions (enqueue_skill, note_skill_client);
// the tables themselves only allow SELECT.
import { appliedIds } from "./registry";

export interface Submission {
  id: string;
  received: string;
  skill: string;
  platform: string;
  files: Record<string, string>;
  note?: string | null;
  promote?: boolean | null;
  ported_from_canonical?: boolean | null;
  client?: string | null;
}

export interface ClientRecord {
  platform: string;
  client_name: string;
  client_version?: string | null;
  user_agent?: string | null;
  first_seen: string;
  last_seen: string;
}

// Publishable values, safe in a public repo: tables are read-only to this key and every write
// goes through functions that verify the caller's write key against a hash stored in the database.
const URL_ = (process.env.SKILLS_SUPABASE_URL ?? "https://buacdfecwjznuozlltmi.supabase.co").replace(/\/$/, "");
const KEY = process.env.SKILLS_SUPABASE_KEY ?? "sb_publishable_yR-l_9bLYRm3TODQnsmKOg_aa3XoEhh";

export function queueReady(): boolean {
  return Boolean(URL_ && KEY && !KEY.startsWith("__"));
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!URL_ || !KEY) throw new Error("Queue storage is not configured.");
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: KEY,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.text();
  return (body ? JSON.parse(body) : null) as T;
}

function newId(): string {
  const t = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${t}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function enqueue(sub: Omit<Submission, "id" | "received">, writeKey: string): Promise<Submission> {
  const full: Submission = { ...sub, id: newId(), received: new Date().toISOString() };
  await rest("rpc/enqueue_skill", { method: "POST", body: JSON.stringify({ p_key: writeKey, payload: full }) });
  return full;
}

const keyCache = new Map<string, { ok: boolean; at: number }>();

/** True when the database recognizes this write key. Cached for 5 minutes per key. */
export async function writeKeyValid(key: string): Promise<boolean> {
  if (!key || key.length < 16 || key.length > 200) return false;
  const hit = keyCache.get(key);
  if (hit && Date.now() - hit.at < 300_000) return hit.ok;
  let ok = false;
  try {
    ok = (await rest<boolean>("rpc/check_skill_key", { method: "POST", body: JSON.stringify({ p_key: key }) })) === true;
  } catch {
    ok = false;
  }
  keyCache.set(key, { ok, at: Date.now() });
  return ok;
}

/** Pending submissions, oldest first. Prunes any the repo already applied. */
export async function pending(): Promise<Submission[]> {
  if (!queueReady()) return [];
  const [rows, done] = await Promise.all([
    rest<Submission[]>("skill_queue?select=*&order=received.asc&limit=500"),
    appliedIds(),
  ]);
  // Applied rows are filtered here and expire in the database after 14 days.
  return rows.filter((r) => !done.has(r.id));
}

export async function recordClient(c: Omit<ClientRecord, "first_seen" | "last_seen">): Promise<void> {
  if (!queueReady()) return;
  await rest("rpc/note_skill_client", {
    method: "POST",
    body: JSON.stringify({
      p_platform: c.platform,
      p_client_name: c.client_name,
      p_client_version: c.client_version ?? null,
      p_user_agent: c.user_agent ?? null,
    }),
  }).catch(() => undefined);
}

export async function clients(): Promise<ClientRecord[]> {
  if (!queueReady()) return [];
  return rest<ClientRecord[]>("skill_clients?select=*&order=platform.asc").catch(() => []);
}
