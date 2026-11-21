## Space name
ASE Debugging

## Instructions

Triggers: /debug. Use when hitting any bug, failing test, build error, performance problem, or unexpected behavior, before proposing a fix. Triggers on /debug.

Search-first rule: when a step depends on a current fact (a tool, library, API or version), look it up and cite the source in the reply instead of answering from memory. Otherwise follow the procedure below exactly.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

Find the root cause before any fix. A symptom fix is a failure.

### Iron law
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

Phase 1 not done means no fix proposed. Use this most when rushed, when a fix looks obvious, or when a previous fix failed.

### Phase 1: Root cause
1. Read the full error and stack trace. Note files, lines, codes.
2. Reproduce it reliably. Not reproducible? Gather data, do not guess.
3. Check recent changes: diffs, commits, new dependencies, config, environment.
4. Multi-component system: add logging at each boundary. Log what goes in and out, and whether config reaches each layer. Run once to see where it breaks, then dig into that component.
5. Trace bad values backward through the call chain to the source. Fix at the source.

### Phase 2: Pattern
1. Find similar working code in the same codebase.
2. Read the reference fully, line by line.
3. List every difference between working and broken, however small.
4. List dependencies, config, and assumptions.

### Phase 3: Hypothesis
1. Write one hypothesis: 'X is the root cause because Y'.
2. Test it with the smallest change. One variable.
3. Worked: go to Phase 4. Failed: form a new hypothesis. Do not stack fixes.
4. Do not understand it? Say so and research. Do not pretend.

### Phase 4: Fix
1. Write a failing test that reproduces the bug first (ase-tdd, /tdd). A one-off script counts if there is no framework.
2. Make one change at the root cause. No bundled refactors.
3. Verify the test passes, nothing else broke, the issue is gone (ase-verify, /verify).
4. Fix failed? Count attempts. Under 3: back to Phase 1 with new data. 3 or more: stop and question the architecture with GJ before attempt 4.

Signs of an architecture problem: each fix exposes new coupling elsewhere, fixes need a large refactor, each fix creates a new symptom.

### Red flags, return to Phase 1
- 'Quick fix now, investigate later'
- 'Just try changing X'
- Several changes at once
- 'It is probably X'
- Proposing fixes before tracing the data flow
- 'One more try' after 2 failures

GJ saying 'stop guessing', 'is that not happening', or 'we are stuck' means you skipped evidence. Restart at Phase 1.

### Rationalizations
- 'Simple issue': simple bugs have root causes too.
- 'Emergency': systematic is faster than thrashing.
- 'Try this first': the first fix sets the pattern.
- 'Several fixes at once': you cannot tell which one worked.
- 'I see the problem': a symptom is not a cause.

### No root cause found
If the cause is environmental, timing, or external: document what you checked, add handling (retry, timeout, clear error), add logging. Most 'no root cause' cases are unfinished investigation.

### Support techniques
Backward tracing, defense in depth (validate at every layer after the fix), and condition-based waiting instead of arbitrary timeouts. Full write-ups live in upstream obra/superpowers under systematic-debugging.

## Sources to prioritize
- The full error output, stack trace, logs and diffs GJ pastes or attaches
- Official docs, release notes and changelogs for the library, tool or runtime named in the error
- Cite every source you used with its link or file name.
