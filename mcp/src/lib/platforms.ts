// Platform catalog: what each AI app calls a "skill", its entry file, and how to shape a port.
// Unknown platforms are accepted as-is: any newly connected app gets its own registry column.

export interface PlatformSpec {
  id: string;
  label: string;
  entry: string;
  unit: string;
  format: string;
  install: string;
}

export const PLATFORMS: Record<string, PlatformSpec> = {
  claude: {
    id: "claude",
    label: "Claude",
    entry: "SKILL.md",
    unit: "Skill",
    format:
      "SKILL.md with YAML frontmatter (name: kebab-case, description: what it does AND when to trigger, under 1024 chars). " +
      "Markdown body under 500 lines. Long reference material goes in references/*.md, executable helpers in scripts/.",
    install: "Claude.ai: Settings > Capabilities > Skills > upload. Claude Code: /plugin install all-seeing-eyes@anthropic-agent-skills",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    entry: "GEM.md",
    unit: "Gem",
    format:
      "GEM.md with three sections: '## Name', '## Description' (one line), '## Instructions'. " +
      "Instructions are second-person directives, fully self-contained: inline any reference material, no file paths, no tool names Gemini lacks.",
    install: "Gemini: Gems > New Gem (or edit) > paste Name, Description, Instructions.",
  },
  grok: {
    id: "grok",
    label: "Grok",
    entry: "PROJECT.md",
    unit: "Project",
    format:
      "PROJECT.md with '## Project name' and '## Custom instructions'. Directive and compact. " +
      "State slash-command triggers at the top. Inline essentials; Grok projects cannot load side files on demand.",
    install: "Grok: Projects > New Project (or edit) > Custom instructions.",
  },
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    entry: "GPT.md",
    unit: "Custom GPT / Project",
    format:
      "GPT.md with '## Name', '## Description', '## Instructions', '## Conversation starters'. " +
      "Instructions under 8000 characters; move overflow into a knowledge file section '## Knowledge'.",
    install: "ChatGPT: Explore GPTs > Create (or a Project's instructions).",
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    entry: "SPACE.md",
    unit: "Space",
    format:
      "SPACE.md with '## Space name', '## Instructions', '## Sources to prioritize'. Search-first: tell it what to look up and how to cite.",
    install: "Perplexity: Spaces > New Space > Instructions.",
  },
};

export const CORE_PLATFORMS = ["claude", "gemini", "grok", "perplexity"];

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isValidName(name: string): boolean {
  return NAME_RE.test(name);
}

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Map an MCP clientInfo.name or User-Agent to a registry platform id. */
export function detectPlatform(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s.includes("claude") || s.includes("anthropic")) return "claude";
  if (s.includes("openai") || s.includes("chatgpt")) return "chatgpt";
  if (s.includes("grok") || s.includes("xai")) return "grok";
  if (s.includes("gemini") || s.includes("google")) return "gemini";
  if (s.includes("perplexity")) return "perplexity";
  if (s.includes("cursor")) return "cursor";
  if (s.includes("codex")) return "codex";
  if (s.includes("copilot")) return "copilot";
  const slug = slugify(raw.split("/")[0]);
  return slug && isValidName(slug) ? slug : undefined;
}

export function spec(id: string): PlatformSpec {
  return (
    PLATFORMS[id] ?? {
      id,
      label: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      entry: "SKILL.md",
      unit: "custom instructions",
      format:
        "SKILL.md: '## Name', '## Description' (what it does and when to use it), '## Instructions' (self-contained directives).",
      install: "Paste the Instructions section wherever this app stores reusable custom instructions.",
    }
  );
}
