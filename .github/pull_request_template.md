# Add [Skill Name] v[Version] Skill

## Description
Deploys [Skill Name] v[Version] as a Claude skill with local Claude Code integration.

## Files Added
- `skills/[skill-slug]/` – Skill definition & resources
- `.claude/skills/[skill-slug]` – Local Claude Code symlink

## Integration Points
- **Claude Code:** Via `.claude/skills/` local registry
- **Claude.ai:** Ready for publication via deployment guide

## Verification Checklist
- [ ] All required skill files present in `skills/[skill-slug]/`
  - [ ] SKILL.md with valid frontmatter
  - [ ] README.md with documentation
  - [ ] CHANGELOG.md (if versioned)
  - [ ] Data payload files (if applicable)
- [ ] Symlink active at `.claude/skills/[skill-slug]`
- [ ] SKILL.md validates per [anthropics/skills](https://github.com/anthropics/skills) standard
- [ ] README.md documents usage and examples
- [ ] No merge conflicts with main branch
- [ ] All files properly formatted

## Testing
- [ ] Skill loads successfully in Claude Code
- [ ] SKILL.md instructions are clear and actionable
- [ ] Example usage scenarios documented

## Related
- Parent Repository: [anthropics/skills](https://github.com/anthropics/skills)
- Deployment Workflow: [docs/DEPLOYMENT_WORKFLOW.md](../blob/main/docs/DEPLOYMENT_WORKFLOW.md)
- Skill Registry: [docs/SKILL_REGISTRY.md](../blob/main/docs/SKILL_REGISTRY.md)

## Additional Notes
<!-- Add any additional context about this skill deployment -->
