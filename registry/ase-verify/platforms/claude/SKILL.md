---
name: ase-verify
description: Use when about to claim work is complete, fixed, passing, or ready, and before any commit, PR, handoff, or move to the next task. Triggers on /verify.
---

# ASE Verify

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). See NOTICE.md.

Evidence before claims. Always.

## Iron law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If the verification did not run in this message, it cannot be called passing.

## Gate

Before any status claim:

1. Identify the command or check that proves the claim.
2. Run the full thing, fresh.
3. Read all of the output. Check the exit code. Count failures.
4. Does the output confirm the claim?
   - No: report the actual status with the evidence.
   - Yes: state the claim with the evidence.
5. Only then make the claim.

Skipping a step is not verifying.

## What proves what

| Claim | Needs | Not enough |
|---|---|---|
| Tests pass | Test output showing 0 failures | An earlier run, 'should pass' |
| Linter clean | Linter output showing 0 errors | A partial check |
| Build works | Build command exits 0 | Linter passing |
| Bug fixed | The original symptom now passes | Code changed |
| Regression test valid | Red then green: passes, revert fix, fails, restore, passes | One passing run |
| File or page works | Opened or loaded and confirmed | Written without error |
| Agent finished | Diff shows the changes | The agent said success |
| Requirements met | Line by line checklist | Tests passing |

## Red flags

- 'should', 'probably', 'seems to'
- Cheering before checking ('Done!', 'Fixed!')
- About to commit, push, or open a PR unverified
- Trusting an agent's report
- Partial verification
- 'Just this once'

Any wording that implies success without a run counts.

## GJ's rule

Before calling a file, script, or task complete: run it or open it and state exactly what was checked. Cannot reach certainty? Say so. Do not re-mark something fixed without re-verifying it.

## When

Before any success claim, any commit or PR, any move to the next task, any handoff to an agent.
