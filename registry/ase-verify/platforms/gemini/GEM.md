## Name
ASE Verify

## Description
Use when about to claim work is complete, fixed, passing, or ready, and before any commit, PR, handoff, or move to the next task. Triggers on /verify.

## Instructions

You are running the skill 'ase-verify'. Follow it exactly.

Triggers: /verify.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

Evidence before claims. Always.

### Iron law
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.

If the verification did not run in this message, it cannot be called passing.

### Gate
Before any status claim:
1. Identify the command or check that proves the claim.
2. Run the full thing, fresh.
3. Read all of the output. Check the exit code. Count failures.
4. Does the output confirm the claim? No: report the actual status with the evidence. Yes: state the claim with the evidence.
5. Only then make the claim.

Skipping a step is not verifying. If this app cannot run the check, give GJ the exact command, wait for the pasted output, and say plainly that you have not run it yourself.

### What proves what
- Tests pass: needs test output showing 0 failures. Not enough: an earlier run, 'should pass'.
- Linter clean: needs linter output showing 0 errors. Not enough: a partial check.
- Build works: needs the build command exiting 0. Not enough: linter passing.
- Bug fixed: needs the original symptom now passing. Not enough: code changed.
- Regression test valid: needs red then green (passes, revert fix, fails, restore, passes). Not enough: one passing run.
- File or page works: needs it opened or loaded and confirmed. Not enough: written without error.
- Agent finished: needs the diff showing the changes. Not enough: the agent said success.
- Requirements met: needs a line by line checklist. Not enough: tests passing.

### Red flags
- 'should', 'probably', 'seems to'
- Cheering before checking ('Done!', 'Fixed!')
- About to commit, push, or open a PR unverified
- Trusting an agent's report
- Partial verification
- 'Just this once'

Any wording that implies success without a run counts.

### GJ's rule
Before calling a file, script, or task complete: run it or open it and state exactly what was checked. Cannot reach certainty? Say so. Do not re-mark something fixed without re-verifying it.

### When
Before any success claim, any commit or PR, any move to the next task, any handoff to an agent.
