// MCP tools for the ALL SEEING EYES skill registry.
// Read tools are public (the repo is public). Write tools register only on the key-gated handler.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CORE_PLATFORMS, detectPlatform, isValidName, slugify, spec } from "@/lib/platforms";
import { clients, enqueue, pending, queueHealth, type Submission } from "@/lib/queue";
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
    const v = st?.version && st.state !== "missing" ? ` v${st.version}` : "";
    return `${p}: ${st?.state ?? "missing"}${v}`;
  });
  return `- ${s.name} (canonical ${s.canonical.platform ?? "none"} v${s.canonical.version}) | ${cells.join(" | ")}`;
}

const FilesSchema = z
  .record(z.string(), z.string())
  .describe("Map of relative file path to full file text, e.g. {\"SKILL.md\": \"...\", \"references/voice.md\": \"...\"}.");

export function registerReadTools(server: McpServer): void {
  server.registerTool(
    "skills_list",
    {
      title: "List skills",
      description:
        "Every skill in GJ's ALL SEEING EYES registry with its canonical (newest) version and the state of each AI platform's copy " +
        "(current, behind, missing). Use first to see what exists.",
      inputSchema: { platform: z.string().optional().describe("Only show this platform's column, e.g. grok") },
    },
    async ({ platform }) => {
      const { bundle, source } = await loadBundle();
      const plats = platform ? [slugify(platform)] : bundle.platforms;
      const lines = Object.values(bundle.skills)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => `${statusLine(s, plats)}\n  ${s.summary.slice(0, 200)}`);
      return text(`Registry ${REPO} (${source}), ${lines.length} skills\n\n${lines.join("\n")}`);
    },
  );

  server.registerTool(
    "skills_get",
    {
      title: "Get a skill",
      description:
        "Full files of one skill for one platform. Omit platform to get the version for the app calling this tool, " +
        "falling back to the canonical copy when that app has none yet (then run skills_port_task to tailor it).",
      inputSchema: {
        name: z.string().describe("Skill name, e.g. dfs-parlaypro"),
        platform: z.string().optional().describe("claude, gemini, grok, chatgpt, perplexity, or any connected app id"),
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
        "Drift dashboard: which platform copies are behind or missing (the port queue), submissions waiting to land in the repo, " +
        "and which AI apps have connected to this registry.",
    },
    async () => {
      const [{ bundle, source }, queue, seen, storage] = await Promise.all([loadBundle(), pending(), clients(), queueHealth()]);
      const plats = Array.from(new Set([...bundle.platforms, ...seen.map((c) => c.platform)]));
      const skills = Object.values(bundle.skills).sort((a, b) => a.name.localeCompare(b.name));
      const portQueue = skills.flatMap((s) =>
        plats
          .filter((p) => {
            const st = s.platforms[p]?.state ?? "missing";
            return st === "behind" || (st === "missing" && (CORE_PLATFORMS.includes(p) || seen.some((c) => c.platform === p)));
          })
          .map((p) => `${s.name} -> ${p} (${s.platforms[p]?.state ?? "missing"})`),
      );
      return json({
        registry: `https://github.com/${REPO}/blob/main/registry/STATUS.md`,
        source,
        generated: bundle.generated,
        platforms: plats,
        skills: skills.map((s) => statusLine(s, plats)),
        port_queue: portQueue,
        pending_submissions: queue.map((q) => ({ id: q.id, skill: q.skill, platform: q.platform, received: q.received, note: q.note })),
        connected_apps: seen.map((c) => ({ platform: c.platform, client: c.client_name, first_seen: c.first_seen, last_seen: c.last_seen })),
        queue_storage: storage,
      });
    },
  );

  server.registerTool(
    "skills_port_task",
    {
      title: "Port a skill to a platform",
      description:
        "Conversion brief for bringing one platform's copy up to the canonical version: the canonical files, the target's current copy, " +
        "and the target platform's format rules. Write the ported copy, then submit it with skills_submit (ported_from_canonical: true).",
      inputSchema: {
        name: z.string(),
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
      description: "Detects which AI app is calling this server and lists the skills that app is missing or running behind on.",
    },
    async (extra) => {
      const me = callerPlatform(extra);
      const { bundle } = await loadBundle();
      if (!me) return text("Platform not detected from this connection. Pass platform explicitly to other tools.");
      const todo = Object.values(bundle.skills)
        .filter((s) => (s.platforms[me]?.state ?? "missing") !== "current")
        .map((s) => `${s.name}: ${s.platforms[me]?.state ?? "missing"}`);
      return text(
        `You are connected as "${me}" (${spec(me).label}). Skills needing work for you:\n${todo.join("\n") || "none, all current"}`,
      );
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
        "Save a new or updated skill from this app into GJ's registry. It is committed to github.com/allsxxing/skills automatically " +
        "within about 10 minutes, versioned, and drift-checked against every other platform. Use whenever a skill, Gem, Project, " +
        "custom GPT, Space, or reusable instruction set is created or edited.",
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
        return text(
          `Queued ${name} for ${spec(platform).label} (submission ${sub.id}, ${Object.keys(files).length} files). ` +
            `It lands in github.com/${REPO}/tree/main/registry/${name} on the next intake run (about every 10 minutes).`,
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
        "Bulk intake. Push every custom skill, Gem, Project, custom GPT, Space, saved prompt protocol, or reusable instruction set this app " +
        "holds for GJ into the registry in one call. Run this the first time an app connects, and any time GJ asks to sync. " +
        "Include each item's full text; identical copies are skipped automatically.",
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
      return text(
        `${spec(platform).label} sync: ${results.length} items\n${results.join("\n")}\n\nThey land in github.com/${REPO} on the next intake run (about every 10 minutes).`,
      );
    },
  );
}

export const READ_INSTRUCTIONS =
  "ALL SEEING EYES skill registry for GJ (@allsxxing): the single source of truth for every skill GJ uses across Claude, Gemini, Grok, " +
  "ChatGPT, Perplexity and any other connected app. skills_list shows everything; skills_get returns this app's copy (or the canonical one); " +
  "skills_status shows what is behind; skills_port_task gives the brief to tailor a skill to this app. When GJ asks for a skill or protocol by " +
  "name or slash command, fetch it here before answering.";

export const WRITE_INSTRUCTIONS =
  READ_INSTRUCTIONS +
  " This connection can also save. On first connect in a conversation where GJ mentions skills, sync, or setup, call skills_whoami, then " +
  "skills_sync_platform with every custom skill, Gem, Project, GPT, Space, or reusable instruction set you can see for GJ, full text, so the " +
  "registry holds this app's versions. Whenever a skill is created or edited here, call skills_submit with the full new text. Never ask GJ to " +
  "copy, paste, or upload skills by hand; do it through these tools.";
