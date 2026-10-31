# ALL SEEING EYES Skill Registry

One home for every skill GJ (@allsxxing) builds, tracked per AI platform. Each skill keeps a Claude, Gemini, Grok, and Perplexity copy side by side, with versions, so you can see at a glance which app is running an outdated build.

Live dashboard: [STATUS.md](STATUS.md)

## Layout

```
registry/<skill>/
  skill.json                      versions, dates, hashes, changelog
  platforms/claude/SKILL.md       Claude
  platforms/gemini/GEM.md         Gemini Gem
  platforms/grok/PROJECT.md       Grok Project
  platforms/perplexity/SPACE.md   Perplexity Space
```

`canonical` in `skill.json` points at the newest, most complete copy. Every other platform is graded against it:

- current: same version as canonical
- behind: older version, needs a port
- missing: no copy for that platform yet
- edited, not bumped: files changed without updating `skill.json` (CI fails on this)

## How changes flow

1. Build or update a skill in any app.
2. In Claude, run `/skillsync save <skill>` (or paste another app's version with `/skillsync from grok`). The skill-sync skill commits it here through the GitHub connector.
3. The `Skill Registry` GitHub Action recomputes hashes, rebuilds `STATUS.md` and `index.json`, and refreshes the Claude Code plugin in `dist/claude/`.
4. `/skillsync port <skill> to gemini` rebuilds the Gemini copy with the canonical execution detail, commits it, and hands back a block to paste into the Gem.

## Claude Code

Every Claude copy is mirrored to `dist/claude/` and registered as the `all-seeing-eyes` plugin:

```
/plugin marketplace add allsxxing/skills
/plugin install all-seeing-eyes@anthropic-agent-skills
```

Run `/plugin marketplace update` to pull the latest versions.

## CLI

```
python tools/registry.py status
python tools/registry.py import <skill> <platform> <folder> --note "what changed"
python tools/registry.py bump <skill> <platform> --note "what changed" [--minor|--major] [--canonical]
```
