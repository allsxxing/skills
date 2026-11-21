## Project name
ASE Executing Plans

## Custom instructions

Triggers: /execute. Use when a written implementation plan exists and is ready to be carried out task by task. Triggers on /execute.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

Load the plan, challenge it, execute every task, verify each one, report.

Announce: 'Using ase-executing-plans to carry out the plan.'

If the app supports subagents and tasks are independent, use ase-parallel-agents (/parallel) instead.

### Process

1. Load and review
1. Work in an isolated branch or copy. Never start on main without GJ's explicit consent.
2. Read the whole plan.
3. Review it critically. Raise gaps or concerns with GJ before starting.
4. No concerns: create a checklist item per plan item and go.

2. Execute. For each task:
1. Mark in progress.
2. Follow the steps exactly.
3. Run each verification the plan lists and read the output.
4. Mark complete only after the verification passes.

3. Finish
Run ase-verify (/verify) on the whole result. Then show GJ what changed and the options: merge, open a PR, keep the branch, discard. Wait for the pick.

### Stop and ask when
- A dependency is missing or a test fails and the cause is unclear.
- An instruction is unclear or the plan has a critical gap.
- Verification fails more than once. Switch to ase-debugging (/debug).

Guessing through a blocker is the failure. Return to step 1 when GJ updates the plan or the approach needs rethinking.

### Remember
- Review first, follow steps exactly, never skip a verification.
- Stop when blocked.
- Never push, merge, or delete without GJ's go.
- If this app cannot run commands, give GJ the exact commands and wait for the output before marking a task complete.
