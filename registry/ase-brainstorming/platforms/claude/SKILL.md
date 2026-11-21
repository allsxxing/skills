---
name: ase-brainstorming
description: Use before any creative or build work, including new features, tools, sites, prompts, content systems, or behavior changes. Triggers on /brainstorm.
---

# ASE Brainstorming

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). See NOTICE.md.

Turn an idea into an approved design before anything gets built.

## Hard gate

No code, files, scaffolds, or builds until a design is presented and GJ approves it. This holds for every task. A short design (a few sentences) is fine. No design is not.

'Too simple to need a design' is the trap. Simple tasks hide the assumptions that cause the most rework.

## Checklist (track each as a task)

1. Read the context: files, docs, repo, project docs, prior work.
2. Scope check. If the request spans several independent systems, split into sub-projects and brainstorm the first one only.
3. Ask clarifying questions, one per message. Prefer multiple choice. Cover purpose, constraints, success criteria.
4. Propose 2 or 3 approaches with trade-offs. Lead with the recommendation. Cut anything not needed (YAGNI).
5. Present the design in sections sized to the complexity. Get a yes after each section. Cover architecture, components, data flow, error handling, testing.
6. Write the design doc to `docs/specs/YYYY-MM-DD-topic-design.md`, or wherever GJ says.
7. Self-review the doc: placeholders, contradictions, scope, ambiguity. Fix inline.
8. Ask GJ to review the written doc. Wait.
9. Hand off to ase-writing-plans. That is the only skill that follows.

## Design rules

- Small units with one job and a clear interface. If a unit cannot be understood without reading its internals, the boundary is wrong.
- Existing code: follow its patterns. Include only improvements the current goal needs.
- Visuals: offer a mockup or diagram only when seeing beats reading. Offer once, as its own message. If GJ declines, stay text-only.

## Red flags

| Thought | Reality |
|---|---|
| 'I already know what to build' | Present it and get the yes anyway. |
| 'Let me scaffold while we talk' | That is the gate violation. |
| 'One more question and a half' | One question per message. |
