// MCP tools for the ALL SEEING EYES skill registry.
// Read tools are public (the repo is public). Write tools register only on the key-gated handler.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CORE_PLATFORMS, classifyClient, detectPlatform, isValidName, slugify, spec } from "@/lib/platforms";
import {
  clients,
  dispatchConfigured,
  dispatchIntake,
  enqueue,
  landingNote,
  pending,
  queueHealth,
  type Submission,
} from "@/lib/queue";
import { REPO, findSkill, loadBundle, type SkillRecord } from "@/lib/registry";

type Result = { content: Array<{ type: "text"; text: string }>; isError?: boolean };
const text = (t: string): Result => ({ content: [{ type: "text", text: t }] });
const json = (d: unknown): Result => text(JSON.stringify(d, null, 2));
const fail = (t: string): Result => ({ content: [{ type: "text", text: t }], isError: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callerPlatform(extra: any): string | undefined {
  const h = extra?.requestInfo?.headers ?? {};
  const pick = (k: string) => {
    const v = h[k] ?? h[k.toLowerCase()];
    return Array.isArray(v) ? v[0] : v;
  };
  return detectPlatform(pick("x-mcp-client") ?? pick("user-agent"));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callerClient(extra: any) {
  const h = extra?.requestInfo?.headers ?? {};
  const pick = (k: string) => {
    const v = h[k] ?? h[k.toLowerCase()];
    return Array.isArray(v) ? v[0] : v;
  };
  const raw = pick("x-mcp-client") ?? pick("user-agent");
  return { raw: raw as string | undefined, id: classifyClient(raw) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeKey(extra: any): string {
  const h = extra?.requestInfo?.headers ?? {};
  const v = h["x-skills-write-key"];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function renderFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([path, body]) => `===== ${path} =====\n${body}`)
    .join("\n\n");
}

function statusLine(s: SkillRecord, platforms: string[]): string {
  const cells = platforms.map((p) => {
    const st = s.platforms[p];
    if (!st || st.state === "missing") return `${p}: missing`;
    // A port keeps its own version line, so show which canonical version it was built from.
    const from = st.synced_from ? ` from v${st.synced_from}` : "";
    return `${p}: ${st.state} v${st.version ?? "?"}${from}`;
  });
  return `- ${s.name} (canonical ${s.canonical.platform ?? "none"} v${s.canonical.version}) | ${cells.join(" | ")}`;
}

const FilesSchema = z
  .record(z.string(), z.string())
  .describe("Map of relative file path to full file text, e.g. {\"SKILL.md\": \"...\", \"references/voice.md\": \"...\"}.");

export interface ToolOpts {
  /** True on a key-gated connection, which also gets the write tools. */
  canWrite: boolean;
}

export function registerReadTools(server: McpServer, opts: ToolOpts = { canWrite: false }): void {
  server.registerTool(
    "skills_list",
    {
      title: "List skills",
      description:
        "Names, summaries and per-platform versions of the skills in GJ's registry. Returns a page of results, newest canonical " +
        "version per skill. Does not return skill contents: use skills_get for one skill's files, or skills_status for the drift " +
        "dashboard and the port queue.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        platform: z
          .string()
          .optional()
          .describe("Narrow the version columns to one platform, e.g. grok. Omit to show every platform."),
        search: z.string().optional().describe("Only skills whose name or summary contains this text."),
        limit: z.number().int().min(1).max(100).default(25).describe("Skills per page. Hard cap 100."),
        offset: z.number().int().min(0).default(0).describe("Skip this many skills. Use next_offset from a previous call."),
      },
    },
    async ({ platform, search, limit, offset }) => {
      const { bundle, source } = await loadBundle();
      const plats = platform ? [slugify(platform)] : bundle.platforms;
      const q = search?.toLowerCase().trim();
      const all = Object.values(bundle.skills)
        .filter((s) => !q || s.name.includes(q) || s.summary.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
      const page = all.slice(offset, offset + limit);
      const lines = page.map((s) => `${statusLine(s, plats)}\n  ${s.summary.slice(0, 160)}`);
      const more = offset + page.length < all.length;
      return text(
        `Registry ${REPO} (${source}), showing ${page.length} of ${all.length} skills` +
          `${q ? ` matching "${search}"` : ""}\n\n${lines.join("\n")}` +
          (more ? `\n\n${all.length - offset - page.length} more. Call again with offset ${offset + page.length}.` : ""),
      );
    },
  );

  server.registerTool(
    "skills_get",
    {
      title: "Get a skill",
      description:
        "The full file contents of one skill, for one platform. Omit platform to get the calling app's own copy, falling back to " +
        "the canonical copy when that app has none. Returns file text, which can be long. For names and versions only, use " +
        "skills_list; for a conversion brief rather than raw files, use skills_port_task.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        name: z.string().min(1).max(64).describe("Skill name in kebab-case, e.g. dfs-parlaypro. Get names from skills_list."),
        platform: z
          .string()
          .optional()
          .describe("claude, gemini, grok, chatgpt, perplexity, or any connected app id. Omit to use the calling app."),
      },
    },
    async ({ name, platform }, extra) => {
      const { bundle } = await loadBundle();
      const s = findSkill(bundle, name);
      if (!s) return fail(`No skill named "${name}". Call skills_list.`);
      const want = platform ? slugify(platform) : callerPlatform(extra) ?? s.canonical.platform ?? "claude";
      const files = s.files[want];
      if (files) {
        const st = s.platforms[want];
        return text(
          `${s.name} for ${spec(want).label} v${st?.version ?? "?"} (${st?.state ?? "unknown"}; canonical is ${s.canonical.platform} v${s.canonical.version})\n\n${renderFiles(files)}`,
        );
      }
      const canon = s.canonical.platform ? s.files[s.canonical.platform] : undefined;
      if (!canon) return fail(`${s.name} has no stored files yet.`);
      return text(
        `${s.name} has no ${spec(want).label} copy yet. Canonical copy (${s.canonical.platform} v${s.canonical.version}) below. ` +
          `Call skills_port_task with platform "${want}" to get the conversion brief.\n\n${renderFiles(canon)}`,
      );
    },
  );

  server.registerTool(
    "skills_status",
    {
      title: "Registry status",
      description:
        "Drift dashboard: how many platform copies are behind or missing, what is queued to land in the repo, and which apps have " +
        "connected. Returns counts and the work that needs doing; pass detail \"full\" for every row. Covers the whole registry, " +
        "unlike skills_whoami which covers only the calling app.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        detail: z
          .enum(["summary", "full"])
          .default("summary")
          .describe("summary returns counts and the port queue. full adds a line per skill and every connected client."),
      },
    },
    async ({ detail }) => {
      const [{ bundle, source }, queue, seen, storage] = await Promise.all([loadBundle(), pending(), clients(), queueHealth()]);
      // Columns are the registry's own platforms. A client that merely connects never becomes a
      // column; it earns one the first time it submits a skill, which puts it in the bundle.
      const plats = bundle.platforms;
      const apps = seen.filter((c) => plats.includes(c.platform));
      const visitors = seen.filter((c) => !plats.includes(c.platform));
      const skills = Object.values(bundle.skills).sort((a, b) => a.name.localeCompare(b.name));
      const portQueue = skills.flatMap((s) =>
        plats
          .filter((p) => {
            const st = s.platforms[p]?.state ?? "missing";
            return st === "behind" || st === "unversioned-edit" || (st === "missing" && CORE_PLATFORMS.includes(p));
          })
          .map((p) => `${s.name} -> ${p} (${s.platforms[p]?.state ?? "missing"})`),
      );
      const base = {
        registry: `https://github.com/${REPO}/blob/main/registry/STATUS.md`,
        source,
        generated: bundle.generated,
        platforms: plats,
        counts: {
          skills: skills.length,
          ports_needed: portQueue.length,
          pending_submissions: queue.length,
        },
        port_queue: portQueue.length ? portQueue : ["nothing to port, every platform is current"],
        pending_submissions: queue.map((q) => ({ id: q.id, skill: q.skill, platform: q.platform, received: q.received, note: q.note })),
        intake: dispatchConfigured() ? "instant (server triggers the repo on every save)" : "scheduled only (SKILLS_DISPATCH_TOKEN not set)",
        connected_apps: apps.map((c) => ({ platform: c.platform, client: c.client_name, first_seen: c.first_seen, last_seen: c.last_seen })),
        other_clients: visitors.map((c) => ({ client: c.client_name, last_seen: c.last_seen, note: "not a platform; submits a skill to become one" })),
        queue_storage: storage,
      };
      return json(
        detail === "full"
          ? { ...base, skills: skills.map((s) => statusLine(s, plats)) }
          : { ...base, note: 'Per-skill lines omitted. Call again with detail "full" for every row.' },
      );
    },
  );

  server.registerTool(
    "skills_port_task",
    {
      title: "Port a skill to a platform",
      description:
        "Conversion brief for bringing one platform's copy up to the canonical version: the canonical files, the target's current copy, " +
        "and the target platform's format rules. Write the ported copy, then submit it with skills_submit (ported_from_canonical: true).",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        name: z.string().min(1).max(64).describe("Skill name to port, e.g. dfs-parlaypro."),
        platform: z.string().optional().describe("Target platform. Omit to target the app calling this tool."),
      },
    },
    async ({ name, platform }, extra) => {
      const { bundle } = await loadBundle();
      const s = findSkill(bundle, name);
      if (!s) return fail(`No skill named "${name}".`);
      const target = platform ? slugify(platform) : callerPlatform(extra);
      if (!target) return fail("Could not tell which platform you are. Pass platform explicitly.");
      const cp = s.canonical.platform;
      if (!cp || !s.files[cp]) return fail(`${s.name} has no canonical copy.`);
      const t = spec(target);
      const current = s.files[target];
      return text(
        [
          `PORT ${s.name}: ${spec(cp).label} v${s.canonical.version} (canonical) -> ${t.label}`,
          ``,
          `TARGET FORMAT (${t.unit}, entry file ${t.entry}): ${t.format}`,
          `INSTALL: ${t.install}`,
          ``,
          `RULES: Keep every trigger, step, rule, guardrail, and output format from canonical. Change shape, not substance. ` +
            `Swap tools the target lacks for its nearest equivalent or drop them with a note. No em dashes. ` +
            `Then call skills_submit with name "${s.name}", platform "${target}", files {"${t.entry}": ...}, ported_from_canonical: true.`,
          ``,
          `===== CANONICAL (${cp} v${s.canonical.version}) =====`,
          renderFiles(s.files[cp]),
          ``,
          current
            ? `===== CURRENT ${t.label.toUpperCase()} COPY (v${s.platforms[target]?.version}) =====\n${renderFiles(current)}`
            : `No current ${t.label} copy.`,
        ].join("\n"),
      );
    },
  );

  server.registerTool(
    "skills_whoami",
    {
      title: "Which platform am I",
      description:
        "Which AI app the registry thinks is calling, and the skills that app is missing or behind on. Scoped to the caller; for " +
        "the whole registry use skills_status, and for the full first-run routine use skills_onboard.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (extra) => {
      const me = callerPlatform(extra);
      const { bundle } = await loadBundle();
      if (!me) return text("Platform not detected from this connection. Pass platform explicitly to other tools.");
      const todo = Object.values(bundle.skills)
        .filter((s) => (s.platforms[me]?.state ?? "missing") !== "current")
        .map((s) => `${s.name}: ${s.platforms[me]?.state ?? "missing"}`);
      return text(
        `You are connected as "${me}" (${spec(me).label}). Skills needing work for you:\n${todo.join("\n") || "none, all current"}` +
          `\n\nFor the full first-run routine, call skills_onboard.`,
      );
    },
  );
}


// --- Onboarding -----------------------------------------------------------
// What a brand-new app sees the first time it connects: who it is, what the registry holds, what
// this app is missing, and the sync routine to offer GJ. GJ's rule is greet first, sync on his OK.

async function onboardingReport(extra: unknown, canWrite: boolean): Promise<string> {
  const { id, raw } = callerClient(extra);
  const [{ bundle, source }, seen] = await Promise.all([loadBundle(), clients()]);
  const me = id?.platform;
  const skills = Object.values(bundle.skills).sort((a, b) => a.name.localeCompare(b.name));
  const known = me ? seen.find((c) => c.platform === me) : undefined;
  const firstTime = !known;

  const mine = me
    ? skills.map((s) => ({ name: s.name, state: s.platforms[me]?.state ?? "missing" }))
    : [];
  const behind = mine.filter((m) => m.state !== "current");

  const who = me
    ? `You are ${spec(me).label} (platform id "${me}").`
    : raw
      ? `This app identifies itself as "${raw}", which is not a platform the registry knows yet. ` +
        `It becomes one the first time it saves a skill with an explicit platform name.`
      : `This app did not identify itself. Pass platform explicitly to the other tools.`;

  const lines: Array<string | null> = [
    "ALL SEEING EYES skill registry, connected.",
    "",
    who,
    firstTime && me ? "This is the first time this app has connected." : null,
    `Registry: ${skills.length} skills, ${source}, built ${bundle.generated ?? "unknown"}.`,
    "",
    me
      ? behind.length
        ? `This app is missing or behind on ${behind.length} of ${skills.length}:\n` +
          behind.map((m) => `  ${m.name}: ${m.state}`).join("\n")
        : `This app is current on all ${skills.length} skills.`
      : null,
    "",
    "This connection can:",
    "  read  skills_list, skills_get, skills_status, skills_port_task, skills_whoami, skills_onboard",
    canWrite
      ? "  save  skills_submit, skills_sync_platform"
      : "  save  nothing. This is the read-only URL. Saving needs the key form of the URL, which GJ holds.",
    "",
    "ROUTINE",
    "  1. Done: the report above.",
    canWrite
      ? "  2. PUSH UP. Count every skill, Gem, Project, custom GPT, Space or reusable instruction set " +
        "this app holds for GJ. Tell him the count and the names, then WAIT for his go-ahead. On his " +
        "yes, call skills_sync_platform once with all of them, full text."
      : "  2. PUSH UP is unavailable on this URL. Tell GJ if this app holds skills the registry should have.",
    behind.length
      ? `  3. PULL DOWN. For each of the ${behind.length} above, call skills_port_task then ` +
        (canWrite ? "skills_submit." : "hand GJ the ported text, since this URL cannot save.")
      : "  3. PULL DOWN: nothing to pull, this app is current.",
    "  4. Report what landed and link github.com/" + REPO + ".",
    "",
    "SAY THIS TO GJ NOW, then stop and wait for his answer. His voice: direct, no em dashes, no filler.",
    `  "Registry is connected. ${skills.length} skills on file` +
      (me ? (behind.length ? `, this app is behind on ${behind.length}` : ", this app is current on all of them") : "") +
      `. ` +
      (canWrite ? `Want me to push this app's skills up to the registry?"` : `This URL is read-only, so I can pull but not save."`),
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function registerOnboardTool(server: McpServer, opts: ToolOpts): void {
  server.registerTool(
    "skills_onboard",
    {
      title: "Set this app up with the registry",
      description:
        "The first-run report for this app: which app the registry thinks it is, how many skills the registry holds, which ones " +
        "this app is missing or behind on, whether this connection can save, and a suggested order of work. Read-only; it never " +
        "pushes anything. Broader than skills_whoami, which returns only the missing list.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (extra) => text(await onboardingReport(extra, opts.canWrite)),
  );
}

// --- Prompts: the command list an app shows in its own menu ----------------

export function registerPrompts(server: McpServer, opts: ToolOpts): void {
  const P: Array<[string, string, string, Record<string, z.ZodString> | undefined, (a: Record<string, string>) => string]> = [
    [
      "skills-onboard",
      "Set up this app with the ALL SEEING EYES registry",
      "Run the first-run routine: who am I, what is missing, what to sync.",
      undefined,
      () =>
        "Call skills_onboard, follow the routine it returns, and stop at the step that needs my go-ahead.",
    ],
    [
      "skills-status",
      "Registry status and drift",
      "Show which platform copies are behind or missing and what is waiting to land.",
      undefined,
      () => "Call skills_status and summarise it: what is behind, what is missing, what is queued. Keep it short.",
    ],
    [
      "skills-sync",
      opts.canWrite ? "Push this app's skills to the registry" : "Push this app's skills (needs the key URL)",
      "Collect every skill this app holds and save them to the registry.",
      undefined,
      () =>
        opts.canWrite
          ? "List every skill, Gem, Project, custom GPT, Space or reusable instruction set you hold for me. " +
            "Tell me the count and the names first, wait for my go-ahead, then call skills_sync_platform once with all of them, full text."
          : "This connection is read-only, so skills_sync_platform is unavailable. Call skills_onboard and tell me what is missing.",
    ],
    [
      "skills-get",
      "Load a skill into this conversation",
      "Fetch one skill's full text for this app and follow it.",
      { name: z.string().describe("Skill name, e.g. dfs-parlaypro") },
      (a) => `Call skills_get for "${a.name}", then follow that skill for the rest of this conversation.`,
    ],
    [
      "skills-port",
      "Tailor a skill to this app",
      "Convert the canonical version of a skill into this app's format.",
      { name: z.string().describe("Skill name to port") },
      (a) =>
        `Call skills_port_task for "${a.name}", write the ported copy in this app's format, then ` +
        (opts.canWrite ? "save it with skills_submit (ported_from_canonical: true)." : "show it to me, since this connection cannot save."),
    ],
  ];

  for (const [name, title, description, argsSchema, body] of P) {
    server.registerPrompt(
      name,
      argsSchema ? { title, description, argsSchema } : { title, description },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((args: any) => ({
        messages: [{ role: "user" as const, content: { type: "text" as const, text: body(args ?? {}) } }],
      })) as never,
    );
  }
}

// --- ChatGPT compatibility -------------------------------------------------
// ChatGPT connectors look for tools named exactly "search" and "fetch". They live on their own
// endpoint so these generic names do not crowd the tool list in every other app.

export function registerChatGptTools(server: McpServer): void {
  server.registerTool(
    "search",
    {
      title: "Search GJ's skills",
      description: "Search the ALL SEEING EYES skill registry by name or description. Returns ids to pass to fetch.",
      inputSchema: { query: z.string().describe("Words to look for in a skill name or description.") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query }) => {
      const { bundle } = await loadBundle();
      const q = query.toLowerCase().trim();
      const hits = Object.values(bundle.skills)
        .filter((s) => !q || s.name.includes(q) || s.summary.toLowerCase().includes(q))
        .slice(0, 20)
        .map((s) => ({
          id: s.name,
          title: s.name,
          url: `https://github.com/${REPO}/tree/main/registry/${s.name}`,
        }));
      return json({ results: hits });
    },
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch one skill",
      description: "Full text of one skill from the ALL SEEING EYES registry. Pass an id returned by search.",
      inputSchema: { id: z.string().describe("Skill id from search, e.g. dfs-parlaypro") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const { bundle } = await loadBundle();
      const s = findSkill(bundle, id);
      if (!s) return fail(`No skill with id "${id}". Call search first.`);
      const cp = s.canonical.platform ?? "claude";
      const files = s.files[cp] ?? Object.values(s.files)[0] ?? {};
      return json({
        id: s.name,
        title: s.name,
        text: renderFiles(files),
        url: `https://github.com/${REPO}/tree/main/registry/${s.name}`,
        metadata: { canonical_platform: cp, version: s.canonical.version, summary: s.summary },
      });
    },
  );
}

function normalizeFiles(platform: string, files?: Record<string, string>, content?: string): Record<string, string> | string {
  const out: Record<string, string> = {};
  if (files) for (const [k, v] of Object.entries(files)) out[k] = v;
  if (content && !Object.keys(out).length) out[spec(platform).entry] = content;
  const keys = Object.keys(out);
  if (!keys.length) return "Provide files or content.";
  if (keys.length > 60) return "At most 60 files per skill.";
  for (const k of keys) {
    if (k.startsWith("/") || k.split("/").includes("..") || !k.trim()) return `Unsafe file path "${k}".`;
  }
  const size = keys.reduce((n, k) => n + out[k].length, 0);
  if (size > 900_000) return "Skill is too large (900 KB max).";
  return out;
}

export function registerWriteTools(server: McpServer): void {
  server.registerTool(
    "skills_submit",
    {
      title: "Save a skill to the registry",
      description:
        "Saves one skill from this app into GJ's registry. The copy is queued, committed to github.com/allsxxing/skills, versioned, " +
        "and drift-checked against every other platform. One skill per call; for a whole app's worth at once use skills_sync_platform.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        name: z.string().describe("Skill name in kebab-case. Reuse the existing name when updating."),
        platform: z.string().optional().describe("Platform this copy belongs to. Omit to use the calling app."),
        files: FilesSchema.optional(),
        content: z.string().optional().describe("Shortcut for a single-file skill: the full text of the entry file."),
        note: z.string().optional().describe("One line on what changed."),
        promote: z
          .boolean()
          .optional()
          .describe("true if this copy is now the most complete version and every other platform should be ported from it."),
        ported_from_canonical: z.boolean().optional().describe("true when this copy was produced by skills_port_task."),
      },
    },
    async (args, extra) => {
      const name = slugify(args.name);
      const platform = args.platform ? slugify(args.platform) : callerPlatform(extra);
      if (!isValidName(name)) return fail(`Invalid skill name "${args.name}".`);
      if (!platform || !isValidName(platform)) return fail("Could not tell which platform this is. Pass platform explicitly.");
      const files = normalizeFiles(platform, args.files, args.content);
      if (typeof files === "string") return fail(files);
      try {
        const sub = await enqueue({
          skill: name,
          platform,
          files,
          note: args.note,
          promote: args.promote,
          ported_from_canonical: args.ported_from_canonical,
          client: platform,
        }, writeKey(extra));
        const d = await dispatchIntake(`submit ${name}@${platform}`);
        return text(
          `Queued ${name} for ${spec(platform).label} (submission ${sub.id}, ${Object.keys(files).length} files). ` +
            `${landingNote(d)} Destination: github.com/${REPO}/tree/main/registry/${name}`,
        );
      } catch (e) {
        return fail(`Could not queue: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "skills_sync_platform",
    {
      title: "Sync every skill this app holds",
      description:
        "Saves many skills from this app into GJ's registry in one call: custom skills, Gems, Projects, custom GPTs, Spaces or saved " +
        "instruction sets, each with its full text. Identical copies are skipped. For a single skill use skills_submit.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        platform: z.string().optional().describe("Omit to use the calling app."),
        skills: z
          .array(
            z.object({
              name: z.string(),
              files: FilesSchema.optional(),
              content: z.string().optional(),
              note: z.string().optional(),
              promote: z.boolean().optional(),
            }),
          )
          .min(1)
          .max(40),
      },
    },
    async (args, extra) => {
      const platform = args.platform ? slugify(args.platform) : callerPlatform(extra);
      if (!platform || !isValidName(platform)) return fail("Could not tell which platform this is. Pass platform explicitly.");
      const results: string[] = [];
      for (const item of args.skills) {
        const name = slugify(item.name);
        const files = normalizeFiles(platform, item.files, item.content);
        if (!isValidName(name)) {
          results.push(`${item.name}: skipped, invalid name`);
          continue;
        }
        if (typeof files === "string") {
          results.push(`${name}: skipped, ${files}`);
          continue;
        }
        try {
          const sub: Submission = await enqueue({
            skill: name,
            platform,
            files,
            note: item.note ?? `Synced from ${spec(platform).label}`,
            promote: item.promote,
            client: platform,
          }, writeKey(extra));
          results.push(`${name}: queued (${sub.id})`);
        } catch (e) {
          results.push(`${name}: failed, ${(e as Error).message}`);
        }
      }
      const queued = results.filter((r) => r.includes(": queued")).length;
      const d = queued ? await dispatchIntake(`sync ${platform} x${queued}`) : "nothing queued";
      return text(
        `${spec(platform).label} sync: ${results.length} items, ${queued} queued\n${results.join("\n")}\n\n` +
          `${queued ? landingNote(d) : "Nothing new to land."} Repo: github.com/${REPO}`,
      );
    },
  );
}

export const READ_INSTRUCTIONS =
  "ALL SEEING EYES skill registry for GJ Bordallo (@allsxxing): the single source of truth for every skill, Gem, Project, custom GPT " +
  "and Space he uses across Claude, Gemini, Grok, ChatGPT, Perplexity and any other app he connects.\n\n" +
  "FIRST RUN: the first time you touch this server in a conversation, call skills_onboard before answering anything about skills, " +
  "syncing or setup. It tells you which app you are, what the registry holds, what this app is missing, and the exact greeting to " +
  "give GJ. Follow the routine it returns and stop where it says to wait for him.\n\n" +
  "AFTER THAT: skills_list shows everything. skills_get returns this app's copy of a skill, or the canonical one. skills_status is the " +
  "drift dashboard. skills_port_task gives the brief to rewrite a skill in this app's format. When GJ names a skill, protocol or slash " +
  "command, fetch it here before answering instead of improvising.";

export const WRITE_INSTRUCTIONS =
  READ_INSTRUCTIONS +
  "\n\nTHIS CONNECTION CAN SAVE. skills_onboard will hand you the push-up step: count the skills this app holds, tell GJ the count and " +
  "the names, and wait for his go-ahead before calling skills_sync_platform. Do not push without that yes. Once a skill exists here, " +
  "call skills_submit every time one is created or edited, with the full new text. Saves trigger the repo immediately and land in about " +
  "a minute. Never ask GJ to copy, paste or upload a skill by hand.";
