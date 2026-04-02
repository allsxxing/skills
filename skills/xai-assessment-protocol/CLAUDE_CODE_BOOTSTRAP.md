# CLAUDE CODE BOOTSTRAP PROMPT

Copy and paste this into Claude Code to activate the xAI Assessment Protocol Skill.

---

## PASTE THIS INTO CLAUDE CODE:

```
I have installed the xAI Assessment Protocol Skill in my .claude/skills/ directory.

The skill is located at: .claude/skills/xai-assessment-protocol/

Please verify the skill is detected and ready to use.

Then, when I say "Run the xAI Assessment Cheat Sheet protocol", execute the skill by:
1. Reading SKILL.md from the skill directory
2. Formatting the output exactly as specified in the skill instructions
3. Using the dual codeblock format for mobile tap-copy efficiency

Test activation now: Run the xAI Assessment Cheat Sheet protocol
```

---

## ALTERNATIVE: Manual Skill Verification

If Claude Code doesn't auto-detect the skill, manually load it:

```
Read the file at ~/.claude/skills/xai-assessment-protocol/SKILL.md and follow its instructions to provide the xAI Assessment cheat sheet content when I request it.

Now execute: Run the xAI Assessment Cheat Sheet protocol
```

---

## EXPECTED OUTPUT

Claude Code should respond with:

- **Phase 1:** Text fields (Career Goal, Tools, Workflow) in codeblocks
- **Phase 2:** 3 Inspiration pieces with dual codeblocks (title + URL)
- **Phase 3:** 3 Personal portfolio pieces with dual codeblocks
- **Phase 4:** 7 Alternate backup pieces
- **Combat Protocols:** Troubleshooting references

All formatted for mobile tap-copy efficiency.

---

## TROUBLESHOOTING

### Skill Not Detected
**Symptom:** Claude Code doesn't respond or says skill not found

**Solution 1:** Verify file location
```bash
ls -la ~/.claude/skills/xai-assessment-protocol/SKILL.md
```

**Solution 2:** Check YAML frontmatter
```bash
head -5 ~/.claude/skills/xai-assessment-protocol/SKILL.md
```
Should show:
```yaml
---
name: xai-assessment-protocol
description: Mobile-optimized quick reference for xAI Vision Assessment...
---
```

**Solution 3:** Restart Claude Code
- Quit Claude Code completely
- Reopen and try trigger phrase again

### Wrong Format in Output
**Symptom:** Claude provides content but not in dual codeblock format

**Solution:** Explicitly reference SKILL.md formatting rules
```
Follow the "Response Format" section in SKILL.md exactly:
- Headers outside codeblocks
- Dual codeblocks for each piece (title, then URL)
- No repeating data between header and codeblocks
```

---

**Created:** January 20, 2026  
**For:** Claude Code integration with xAI Assessment Protocol Skill  
**By:** GJ Bordallo (@allsxxing / All Seeing Eyes)
