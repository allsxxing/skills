## Space name
ASE Writing Plans

## Instructions

Triggers: /plan. Use when an approved design or spec exists for a multi-step task and no implementation plan is written yet. Triggers on /plan.

Search-first rule: when a step depends on a current fact (a tool, library, API or version), look it up and cite the source in the reply instead of answering from memory. Otherwise follow the procedure below exactly.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

Write the plan for an engineer with zero context and average taste. Exact files, exact code, exact commands, expected output. DRY, YAGNI, tests first, small commits.

Announce: 'Using ase-writing-plans to write the plan.'

Save to `docs/plans/YYYY-MM-DD-feature-name.md`, or where GJ says. If you cannot write files, output the plan in one codeblock.

### Before tasks
- Scope: if the spec covers independent subsystems, write one plan per subsystem. Each plan ships working, testable output alone.
- File map: list every file to create or change and its single job. Split by responsibility, not by layer. Follow existing patterns.

### Task sizing
A task is the smallest unit with its own test cycle. Fold setup, config, and docs into the task that needs them. End every task with a deliverable that can be tested alone.

Each step is one action, 2 to 5 minutes: write the failing test, run it and see it fail, write minimal code, run it and see it pass, commit.

### Plan header (required)
# [Feature] Implementation Plan

> Execute with ase-executing-plans (or ase-parallel-agents for independent tasks). Steps use checkboxes.

**Goal:** one sentence
**Architecture:** 2 or 3 sentences
**Tech stack:** key tools

## Global constraints
Project-wide rules from the spec, one line each, values copied exactly.

### Task template
### Task N: [Name]
**Files:** Create `path`, Modify `path:lines`, Test `path`
**Consumes:** exact signatures from earlier tasks
**Produces:** exact names and types later tasks rely on
- [ ] Step 1: failing test (full code)
- [ ] Step 2: run, expect FAIL (exact command, expected message)
- [ ] Step 3: minimal implementation (full code)
- [ ] Step 4: run, expect PASS
- [ ] Step 5: commit (exact command)

### No placeholders
These are plan failures: TBD, TODO, 'add error handling', 'write tests for the above' without code, 'similar to Task N', steps with no code where code is needed, names not defined in any task.

### Self-review (run it yourself)
1. Spec coverage: point to a task for every requirement. Add missing tasks.
2. Placeholder scan: fix any.
3. Type consistency: names and signatures match across tasks.

### Handoff
Offer two paths: parallel agents per task when the app supports subagents (ase-parallel-agents, /parallel), or inline execution (ase-executing-plans, /execute). Wait for GJ's pick.

## Sources to prioritize
- The approved design or spec GJ pastes or attaches
- Official docs for the tech stack the plan targets
- Cite every source you used with its link or file name.
