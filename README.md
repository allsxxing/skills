# ⚡ ALL SEEING EYES Skills Registry

One source of truth for every skill GJ Bordallo ([@allsxxing](https://instagram.com/allsxxing)) runs, shared across
Claude, Gemini, Grok, ChatGPT, Perplexity and anything else he connects. Skills live in
[`registry/`](./registry); an MCP server at **skills.allsxxing.com** serves them to any AI app and
takes new ones back.

| | |
| --- | --- |
| Live status | [`registry/STATUS.md`](./registry/STATUS.md) |
| Server health | https://skills.allsxxing.com/api/health |
| How the registry works | [`registry/README.md`](./registry/README.md) |

## 1. Connect the app

Add a custom connector (sometimes called an MCP server) in the app, and paste one of these URLs.
Replace `<key>` with the write key. Without a key the connector can read skills but not save them.

| URL | Use it for |
| --- | --- |
| `https://skills.allsxxing.com/api/mcp` | Any app |
| `https://skills.allsxxing.com/api/chatgpt` | ChatGPT, which needs `search` and `fetch` tools |
| add `?platform=grok` | When an app's user-agent does not say which app it is |

### Authentication

The server has **no sign-in**. Reading is open, because the registry is a public repo. Saving needs
a write key, and the connector decides where that key goes. In order of safety:

| Where the key goes | Notes |
| --- | --- |
| `Authorization: Bearer <key>` header | **Preferred.** Connector UIs store headers encrypted and never show them again. |
| `X-Skills-Key: <key>` header | Use when the UI reserves `Authorization` for itself. `X-API-Key` also works. |
| `https://.../api/mcp/k/<key>` | Path form, for UIs that mangle query strings. The key is in the URL. |
| `https://.../api/mcp?key=<key>` | Least safe. The key is visible anywhere the connector URL is shown, logged or screenshotted. |

In Claude's **Add custom connector** dialog: paste the plain URL, leave Authentication on
**No sign-in**, then under **Request headers** add `Authorization` with the value `Bearer <key>`.
Leave Transport on Streamable HTTP. Nothing goes in the URL.

OAuth is not implemented. The server advertises no authorization server, which is why clients
correctly detect "No sign-in".

Where the setting lives, app by app:

- **Claude** — Settings, then Connectors, then Add custom connector. Name it `allsxxing Skills`.
- **Grok** — Settings, then Connect Apps, then Add MCP Server. Put the URL in Server URL and leave Headers empty.
- **Gemini, Perplexity, ChatGPT** — look for Connectors, Apps or MCP in settings. If it asks for a
  transport, choose Streamable HTTP.

If an app refuses to connect, open the health URL in a browser first. If it answers, the server is
fine and the problem is the app's connector form.

## 2. Paste this into the app

Most apps read the server's own instructions and start the routine themselves. For the ones that
do not, paste this once in a new conversation:

```text
You now have the allsxxing Skills connector. Before anything else:

1. Call skills_onboard. It tells you which app you are, what the registry holds, and
   which skills this app is missing or behind on.
2. Report back in plain language: how many skills exist, what this app is behind on,
   and whether this connection can save.
3. List every custom skill, Gem, Project, GPT, Space or saved instruction set you
   hold for me. Tell me the count and the names. Then stop and wait for my answer.
4. Only after I say go, call skills_sync_platform once with all of them, full text.
5. Then fill the gaps: for each skill this app is missing, call skills_port_task,
   rewrite it in this app's format, and save it with skills_submit using
   ported_from_canonical true.

From then on, without being asked: save every skill I create or edit here with
skills_submit, and whenever I name a skill or slash command, fetch it with
skills_get before answering. Never ask me to copy, paste or upload a skill by hand.
```

## 3. Commands

Apps that support MCP prompts show these in their own menu:

| Command | Does |
| --- | --- |
| `/skills-onboard` | First run: which app this is, what it is missing, what to sync |
| `/skills-status` | What is behind, missing or waiting to land |
| `/skills-sync` | Push every skill this app holds into the registry |
| `/skills-get` | Load one skill into the conversation and follow it |
| `/skills-port` | Rewrite a skill in this app's own format |

Saves are committed to this repo automatically, usually within a minute.

---

> **Note:** This repository contains Anthropic's implementation of skills for Claude. For information about the Agent Skills standard, see [agentskills.io](http://agentskills.io).

[![skills.sh](https://skills.sh/b/anthropics/skills)](https://skills.sh/anthropics/skills)

# Skills
Skills are folders of instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. Skills teach Claude how to complete specific tasks in a repeatable way, whether that's creating documents with your company's brand guidelines, analyzing data using your organization's specific workflows, or automating personal tasks.

For more information, check out:
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
- [Equipping agents for the real world with Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

# About This Repository

This repository contains skills that demonstrate what's possible with Claude's skills system. These skills range from creative applications (art, music, design) to technical tasks (testing web apps, MCP server generation) to enterprise workflows (communications, branding, etc.).

Each skill is self-contained in its own folder with a `SKILL.md` file containing the instructions and metadata that Claude uses. Browse through these skills to get inspiration for your own skills or to understand different patterns and approaches.

Many skills in this repo are open source (Apache 2.0). We've also included the document creation & editing skills that power [Claude's document capabilities](https://www.anthropic.com/news/create-files) under the hood in the [`skills/docx`](./skills/docx), [`skills/pdf`](./skills/pdf), [`skills/pptx`](./skills/pptx), and [`skills/xlsx`](./skills/xlsx) subfolders. These are also open source (Apache 2.0), and we wanted to share them with developers as a reference for more complex skills that are actively used in a production AI application.

## Disclaimer

**These skills are provided for demonstration and educational purposes only.** While some of these capabilities may be available in Claude, the implementations and behaviors you receive from Claude may differ from what is shown in these skills. These skills are meant to illustrate patterns and possibilities. Always test skills thoroughly in your own environment before relying on them for critical tasks.

# Skill Sets
- [./skills](./skills): Skill examples for Creative & Design, Development & Technical, Enterprise & Communication, and Document Skills
- [./spec](./spec): The Agent Skills specification
- [./template](./template): Skill template

# Try in Claude Code, Claude.ai, and the API

## Claude Code
You can register this repository as a Claude Code Plugin marketplace by running the following command in Claude Code:
```
/plugin marketplace add anthropics/skills
```

Then, to install a specific set of skills:
1. Select `Browse and install plugins`
2. Select `anthropic-agent-skills`
3. Select `document-skills` or `example-skills`
4. Select `Install now`

Alternatively, directly install either Plugin via:
```
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

After installing the plugin, you can use the skill by just mentioning it. For instance, if you install the `document-skills` plugin from the marketplace, you can ask Claude Code to do something like: "Use the PDF skill to extract the form fields from `path/to/some-file.pdf`"

## Claude.ai

These example skills are all already available to paid plans in Claude.ai. 

To use any skill from this repository or upload custom skills, follow the instructions in [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude#h_a4222fa77b).

## Claude API

You can use Anthropic's pre-built skills, and upload custom skills, via the Claude API. See the [Skills API Quickstart](https://docs.claude.com/en/api/skills-guide#creating-a-skill) for more.

# Creating a Basic Skill

Skills are simple to create - just a folder with a `SKILL.md` file containing YAML frontmatter and instructions. You can use the **template-skill** in this repository as a starting point:

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2
```

The frontmatter requires only two fields:
- `name` - A unique identifier for your skill (lowercase, hyphens for spaces)
- `description` - A complete description of what the skill does and when to use it

The markdown content below contains the instructions, examples, and guidelines that Claude will follow. For more details, see [How to create custom skills](https://support.claude.com/en/articles/12512198-creating-custom-skills).

# Partner Skills

Skills are a great way to teach Claude how to get better at using specific pieces of software. As we see awesome example skills from partners, we may highlight some of them here:

- **Notion** - [Notion Skills for Claude](https://www.notion.so/notiondevs/Notion-Skills-for-Claude-28da4445d27180c7af1df7d8615723d0)
