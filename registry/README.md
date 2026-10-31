# ALL SEEING EYES Skill Registry

One home for every skill GJ (@allsxxing) runs, tracked per AI app. Each skill keeps a Claude, Gemini, Grok, ChatGPT, Perplexity (and any newly connected app) copy side by side, with versions, so drift between apps is visible and fixable.

Live dashboard: [STATUS.md](STATUS.md)

## The MCP connector

The registry is served as an MCP server from `mcp/` (Next.js, deployed on Vercel with Root Directory set to `mcp`):

```
https://skills-allsxxing.vercel.app/api/mcp            read-only
https://skills-allsxxing.vercel.app/api/mcp?key=...    read + save
```

| Tool | What it does |
|---|---|
| `skills_list` | Every skill and each app's copy state |
| `skills_get` | One skill's files for the calling app (or canonical if it has none) |
| `skills_status` | Port queue, pending saves, connected apps |
| `skills_port_task` | Brief to tailor the canonical copy to an app's format |
| `skills_whoami` | Which app is connected and what it is missing |
| `skills_submit` | Save a new or updated skill (key required) |
| `skills_sync_platform` | Push every skill an app holds in one call (key required) |

Any app that connects is detected from its client name and gets its own column automatically.

## How changes flow

1. An app saves a skill through `skills_submit` or `skills_sync_platform`. It is queued in Vercel Blob.
2. The `Skill Intake` Action runs every 10 minutes, commits queued skills into `registry/<skill>/platforms/<app>/`, versions them, and records their ids in `applied.json` (which prunes the queue).
3. The `Skill Registry` Action and the intake run rebuild `STATUS.md`, `index.json`, `bundle.json`, and the Claude Code plugin in `dist/claude/`.
4. Vercel redeploys on every push; reads also pull `bundle.json` live from `main`, so every app sees changes within a minute.

## Layout

```
registry/<skill>/
  skill.json                      versions, dates, hashes, changelog
  platforms/claude/SKILL.md
  platforms/gemini/GEM.md
  platforms/grok/PROJECT.md
  platforms/chatgpt/GPT.md
  platforms/perplexity/SPACE.md
  platforms/<any-new-app>/...
```

`canonical` in `skill.json` points at the newest, most complete copy. Other copies are graded against it: current, behind, missing, or edited-not-bumped (CI fails on the last one).

## Claude Code

```
/plugin marketplace add allsxxing/skills
/plugin install all-seeing-eyes@anthropic-agent-skills
```

## CLI

```
python tools/registry.py status [--check]
python tools/registry.py import <skill> <platform> <folder> [--note TEXT] [--canonical] [--version X.Y.Z]
python tools/registry.py bump <skill> <platform> [--note TEXT] [--minor|--major] [--canonical]
python tools/registry.py ingest <queue.json>
python tools/registry.py fill-hashes [--base REF]
```
