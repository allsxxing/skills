// Everything the landing page says that is not registry data lives here, so links and copy are
// edited in one place.
export const MCP_URL = "https://skills.allsxxing.com/api/mcp";
export const REPO_URL = "https://github.com/allsxxing/skills";

export const SOCIALS = [
  { id: "instagram", label: "Instagram", handle: "@allsxxing", href: "https://www.instagram.com/allsxxing" },
  { id: "x", label: "X", handle: "@allsxxing", href: "https://x.com/allsxxing" },
  { id: "giphy", label: "GIPHY", handle: "@allsxxing", href: "https://giphy.com/allsxxing" },
  { id: "github", label: "GitHub", handle: "allsxxing", href: "https://github.com/allsxxing" },
] as const;

export const TOOLS = [
  { name: "skills_list", access: "read", does: "Lists every skill with its newest version and how each app's copy compares." },
  { name: "skills_get", access: "read", does: "Returns the full files of one skill for the app you name." },
  { name: "skills_status", access: "read", does: "Shows which copies are current, behind or missing." },
  { name: "skills_port_task", access: "read", does: "Hands the app a ready brief for rewriting a skill in its own format." },
  { name: "skills_whoami", access: "read", does: "Tells the app which platform it is and what it is missing." },
  { name: "skills_submit", access: "save", does: "Saves a new or updated skill from the app back to the registry." },
  { name: "skills_sync_platform", access: "save", does: "Saves every skill the app holds in one pass." },
] as const;

export const APPS = [
  {
    id: "claude",
    label: "Claude",
    steps: [
      "Open Settings, then Connectors.",
      "Choose Add custom connector.",
      "Name it allsxxing Skills and paste the URL.",
      "Save, then turn the connector on in a chat.",
    ],
  },
  {
    id: "grok",
    label: "Grok",
    steps: [
      "Open Settings, then Connect Apps.",
      "Choose Add MCP Server.",
      "Name it allsxxing Skills and paste the URL into Server URL.",
      "Leave Headers empty and choose Add MCP.",
    ],
  },
  {
    id: "other",
    label: "Gemini, Perplexity, ChatGPT",
    steps: [
      "Open the app's connector or MCP settings. The menu is usually called Connectors, Apps or MCP.",
      "Add a remote MCP server. If it asks for a transport, pick Streamable HTTP.",
      "Name it allsxxing Skills and paste the URL.",
      "No sign-in is needed. Save it.",
    ],
  },
] as const;

export const PROMPTS = [
  "Run skills_whoami and tell me what this app is missing.",
  "List my skills and show which copies are behind.",
  "Get the dfs-parlaypro skill for this app and follow it.",
  "Save every skill you have to the allsxxing registry.",
] as const;
