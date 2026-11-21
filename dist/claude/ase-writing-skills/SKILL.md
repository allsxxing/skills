---
name: ase-writing-skills
description: Use when creating a new skill, editing an existing skill, or checking that a skill works before it ships. Triggers on /newskill.
---

# ASE Writing Skills

Remix of obra/superpowers (MIT, Copyright (c) 2025 Jesse Vincent). Modified by GJ Bordallo, ALL SEEING EYES (@allsxxingeyes). See NOTICE.md.

Writing a skill is TDD for process docs. Run a scenario without the skill, watch the agent fail, write the skill, watch it pass, close loopholes.

**Background:** know ase-tdd first.

## Iron law

No skill without a failing baseline first. Applies to new skills and edits. Wrote it before testing? Delete it and start over.

## What a skill is

A reusable technique, pattern, or reference. Not a story about how you solved one problem. Not for one-offs, standard practice, project-only rules, or anything a regex can enforce.

## Format

```
skill-name/
  SKILL.md        required
  NOTICE.md       required if derived from MIT or other licensed work
  other files     only for heavy reference or reusable tools
```

Frontmatter: `name` (letters, numbers, hyphens) and `description`, 1024 characters max.

Description rules:
- Start with 'Use when'. Triggering conditions and symptoms only.
- Never summarize the workflow. Agents follow the description and skip the body.
- Third person. Include search keywords and slash triggers.

Body: Overview with core principle, When to Use, Quick Reference table, Common Mistakes. One good example, not five languages.

## Token budget

Always-loaded skills under 200 words. Everything else under 500 where possible. Cross-reference other skills by name with REQUIRED markers. Do not force-load files. Push detail into tool help or separate files.

## Match the form to the failure

| Baseline failure | Use | Avoid |
|---|---|---|
| Skips a rule under pressure | Prohibition, rationalization table, red flags | Soft words like 'prefer' |
| Right content, wrong shape | A recipe that states what the output is | A list of donts |
| Leaves out a required element | A required field in the template | Prose reminders |
| Depends on a condition | A conditional on something observable | Rule plus exemption clauses |

No nuance clauses ('unless it matters'). They reopen the negotiation.

## Red, green, refactor

1. **Red:** run pressure scenarios without the skill. Use 3 or more combined pressures (time, sunk cost, exhaustion). Record the exact rationalizations.
2. **Green:** write the minimum skill that answers those failures. Re-run. The agent should comply.
3. **Refactor:** new loophole found? Add an explicit counter. Re-test until it holds.

Micro-test wording first: one fresh sample per call, a no-guidance control, 5 or more reps, read every flagged match by hand. If the control does not fail, there is nothing to fix.

## Test by skill type

- Discipline skills: pressure scenarios.
- Technique skills: apply to a new case, then edge cases.
- Pattern skills: recognition and counter-examples.
- Reference skills: retrieval and gap tests.

## Ship checklist (per skill, no batching)

- [ ] Baseline failure documented
- [ ] Name and description follow the rules
- [ ] Skill answers the documented failures
- [ ] Passes the scenarios with the skill loaded
- [ ] Loopholes closed, rationalization table and red flags added
- [ ] No em dashes
- [ ] Submitted with `skills_submit` to the allsxxing registry, or committed to allsxxing/skills
- [ ] Credit upstream and include NOTICE.md when derived from licensed work

Untested skills are untested code.
