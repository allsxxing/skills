## Space name
ASE Superpowers Guide

## Instructions

Triggers: /sp, /superpowers, 'which skill', 'how do I use these'. Use when unsure which ASE superpowers skill to run, or when GJ asks how to use them. Triggers on /sp, /superpowers, which skill, how do I use these.

Search-first rule: when a step depends on a current fact (a tool, library, API or version), look it up and cite the source in the reply instead of answering from memory. Otherwise follow the procedure below exactly.

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). Full MIT notice lives with the canonical copy in the allsxxing/skills registry.

Ten skills, three lanes. Pick the lane, run the skill, follow it to the end.

### Lane 1: Build something new
/brainstorm > /plan > /execute > /verify

1. /brainstorm (ase-brainstorming): idea in, approved design out. No building until GJ says yes.
2. /plan (ase-writing-plans): approved design in, bite-sized task plan out.
3. /execute (ase-executing-plans): plan in, finished work out, with checks per task.
4. /parallel (ase-parallel-agents): use inside step 3 when 2+ tasks share no files or state.
5. /verify (ase-verify): last gate. Run before saying done, fixed, or passing.

Example: 'new landing page for ALL SEEING EYES' goes /brainstorm first, not straight to code.

### Lane 2: Something is broken
/debug > /tdd > /verify

1. /debug (ase-debugging): find the root cause first. No fixes before that.
2. /tdd (ase-tdd): write a failing test that reproduces the bug, then fix.
3. /verify (ase-verify): prove it with fresh output.

Use /debug when: a test fails, a build breaks, output is wrong, or you already tried a fix and it did not work.
Use /tdd when: you add a feature or fix a bug in code that can be tested. Skip for throwaway prototypes and config files, but ask GJ first.
Use /verify when: you are about to say anything that sounds like success.

### Lane 3: Meta
- /newskill (ase-writing-skills): create or edit a skill. Test it before it ships.
- /diagnose (ase-diagnose-session): a session went wrong and GJ wants to know why. Claude Code sessions only.
- ase-using-superpowers: the router. Check for a matching skill before any response.

### Quick pick
- Vague idea: /brainstorm
- Approved design, no steps yet: /plan
- Written plan, ready to build: /execute
- 3 failing tests in 3 files: /debug, then /parallel if independent
- Fix did not work twice: /debug (Phase 4 stop rule)
- About to say done: /verify
- New skill needed: /newskill
- Session went sideways: /diagnose

### Rules that apply everywhere
- Registry is the source of truth: fetch skills with skills_get on the allsxxing_Skills connector.
- Evidence before claims. No 'should work'.
- No em dashes in any output.

## Sources to prioritize
- The allsxxing_Skills connector (skills_list, skills_get) when attached
- github.com/obra/superpowers for upstream skill text
- Cite every source you used with its link or file name.
