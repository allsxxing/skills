---
name: ase-diagnose-session
description: Use when a Claude Code session went wrong and GJ wants to know why: repeated work, ignored plans, a skill that did not fire, slow or expensive runs, or a bug report is needed. Triggers on /diagnose.
---

# ASE Diagnose Session

Remix of obra/superpowers diagnosing-superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). See NOTICE.md.

Condensed version. The upstream skill adds analyst prompts, report and bundle templates, and redaction tooling. Pull those from obra/superpowers if a full export is needed.

Pin down what went wrong in a session, read the transcripts on disk, report with evidence. You report. You do not redesign the skills.

**Core principle:** every finding cites `path:line`. No citation, no finding. Every number comes from the transcript or a command you ran.

## Workflow (one task per step)

1. **Intake.** Ask one question at a time until you can write a problem statement: which session, which turns, what GJ expected, what happened, what to measure. 'It took too long' is a complaint, not a statement. Nothing else starts until GJ answers. If GJ is away, write the questions and stop.
2. **Locate.** Resolve each session to absolute file paths. Confirm a past session by quoting its first prompt and timestamp. List rejected candidates and why. List subagent transcripts. Create a working folder `~/.superpowers/diagnosing/<session-id>/` and tell GJ the path.
3. **Triage.** Read the region around the problem yourself. Then check these dimensions, in parallel if subagents exist: skill timeline, plan adherence, repeated work, stumbles, quality evidence, request conflicts, cost and time. Drop any finding with no `path:line`.
4. **Report.** Write it to the working folder, show it, give the path. State what happened with citations.
5. **Issues or export.** Only if GJ asks. Nothing is posted or archived before GJ sees the exact text or file list.

## Lead with

| Complaint | Look first |
|---|---|
| Too slow | cost and time, stumbles |
| Extra work | repeated work, plan adherence |
| Expensive | cost and time |
| Ignored the plan | plan adherence, compaction lines |
| A skill never fired | skill timeline |

## Hard rules

- **Context safety.** One transcript line can be a megabyte. Never dump a session file. Read slices with line ranges and cut long lines.
- **Read only.** Never edit, move, or delete a session file.
- **Exact paths to subagents.** A subagent's 'current session' is its own.
- **Human prompts only.** Hook output, system reminders, and tool results are not GJ's words.
- **Report, do not redesign.** State which skills were involved. Do not name a defect in a skill or propose a change to it.
- **Approval gates.** No archive, issue, or comment before GJ approves.
- **Citations or silence.** Numbers you did not compute are invented. Cite or drop.

## Red flags

| Thought | Reality |
|---|---|
| 'The problem is obvious, skip intake' | The statement scopes everything. Ask. |
| 'GJ is away, I will reconstruct the statement' | You cannot. Write the questions and stop. |
| 'Sweep everything now, ask later' | An unscoped sweep spends budget on the wrong question. |
| 'Small edit to the skill would fix it' | Not your call. Report the evidence. |
