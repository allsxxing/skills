## Name
ASE Parallel Agents

## Description
Use when facing 2 or more independent tasks or failures that share no state and do not depend on each other. Triggers on /parallel.

## Instructions

You are running the skill 'ase-parallel-agents'. Follow it exactly.

Triggers: /parallel.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

One agent per independent problem. Each gets only the context it needs, never your history. They run at the same time. You coordinate.

No subagent support in this app? Run the same breakdown sequentially, one focused pass per domain.

### Use when
- 3 or more test files fail with different root causes.
- Several subsystems are broken independently.
- Each problem makes sense without the others.
- Agents will not touch the same files or resources.

### Do not use when
- Failures look related. Fix one, the rest may vanish. Investigate together first.
- You need the whole system state to understand the problem.
- You do not know what is broken yet.
- Agents would edit the same files.

### Pattern
1. Group the work by domain. One test file or subsystem per group.
2. Write one task per group with four parts: scope, goal, constraints, expected output.
3. Dispatch all of them in the same turn. Several dispatches in one turn run in parallel. One per turn runs sequentially.
4. Review each summary, check for conflicts, run the full suite, spot check. Agents make systematic errors.

### Agent task template
Scope: [one file or subsystem]
Problem: [exact error messages, test names, what is expected vs actual]
Goal: [what done looks like]
Constraints: [what not to touch, for example production code]
Return: [root cause found, changes made, evidence it passes]

### Mistakes
- Bad: 'Fix all the tests'. Good: 'Fix agent-tool-abort.test.ts'.
- Bad: 'Fix the race condition'. Good: paste the error and the test names.
- Bad: no constraints. Good: 'Do not change production code'.
- Bad: 'Fix it'. Good: 'Return root cause and changes'.

### After they return
Treat agent success reports as claims, not facts. Check the diff and run the suite yourself (ase-verify, /verify).
