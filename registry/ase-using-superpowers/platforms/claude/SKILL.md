---
name: ase-using-superpowers
description: Use at the start of any conversation or task, before responding or asking clarifying questions, to check whether an ASE skill applies.
---

# ASE Using Superpowers

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). See NOTICE.md.

## Rule

If there is a 1% chance a skill applies, load it before doing anything else. That includes clarifying questions, file exploration, and quick answers.

If the skill turns out not to fit, drop it. Skipping the check is the violation.

## Where skills live

- Claude: the Skill tool.
- Any app with the allsxxing_Skills connector: `skills_list` to see names, `skills_get <name>` to load. GJ names a skill or slash command, fetch it before answering.
- Neither available: say so in one line and work from the task directly.

## Priority

1. Process skills first, they set the approach: ase-brainstorming, ase-debugging.
2. Then implementation skills.

Build request goes to /brainstorm first. Bug goes to /debug first.

## Order of instruction

GJ's direct instructions beat skills. Skills beat default behavior. If GJ says skip a step, skip it.

## Red flags

| Thought | Reality |
|---|---|
| 'Just a simple question' | Questions are tasks. Check. |
| 'I need context first' | The skill check comes before context gathering. |
| 'Let me look at the files first' | Skills tell you how to look. Check first. |
| 'I remember this skill' | Skills change. Load the current version. |
| 'Overkill here' | Small tasks grow. Use it. |
| 'I will do one thing first' | Check before doing anything. |

## Skill types

Rigid (ase-tdd, ase-debugging, ase-verify): follow exactly. Flexible (patterns): adapt to context. The skill says which.

Announce at start: 'Using [skill] to [purpose].' If the skill has a checklist, track each item as a task.

See ase-superpowers-guide for the full map.
