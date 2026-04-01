# GitHub Agent Quick Start Guide

This guide provides a quick reference for the GitHub Agent managing skill deployments to the `allsxxing/skills` repository.

## Prerequisites

- Google Drive CloudSync mounted at: `~/Library/CloudStorage/GoogleDrive-/My Drive/✴️Claude/Claude_skills/`
- Repository cloned locally
- GitHub CLI (`gh`) installed
- Bash shell environment

## Quick Reference Commands

### 1. Discover New Skills

```bash
cd /path/to/skills/repository
./scripts/discover-skills.sh --verbose
```

This will:
- List all skills in Google Drive
- Compare with existing skills in repository
- Show which skills are new and ready for deployment
- Validate structure of each new skill

### 2. Validate a Specific Skill

```bash
./scripts/validate-skill.sh ~/Library/CloudStorage/GoogleDrive-/My\ Drive/✴️Claude/Claude_skills/[skill-name]
```

### 3. Deploy a Skill (Dry Run First)

```bash
# Test deployment without making changes
./scripts/deploy-skill.sh [skill-name] --dry-run

# Actually deploy
./scripts/deploy-skill.sh [skill-name]
```

### 4. Create Feature Branch and Push

```bash
# Create branch for the skill
git checkout -b [skill-name]

# Review changes
git status
git diff

# The deploy script already added files, so just commit
git commit -m "Add [skill-name] v[version] skill"

# Push to remote
git push origin [skill-name]
```

### 5. Create Pull Request

```bash
gh pr create \
  --title "Add [skill-name] v[version] skill" \
  --body "$(cat <<'PR_BODY'
Deploys [skill-name] v[version] as a Claude skill with local Claude Code integration.

## Files Added
- `skills/[skill-name]/` – Skill definition & resources
- `.claude/skills/[skill-name]` – Local Claude Code symlink

## Integration Points
- **Claude Code:** Via `.claude/skills/` local registry
- **Claude.ai:** Ready for publication

## Verification Checklist
- [x] All skill files present in `skills/[skill-name]/`
- [x] Symlink active at `.claude/skills/[skill-name]`
- [x] SKILL.md validates per anthropics/skills standard
- [x] README.md documents usage
PR_BODY
)" \
  --base main \
  --head [skill-name]
```

### 6. Add Labels and Assign Reviewer

```bash
# Get PR number from output above
PR_NUMBER=[number]

# Add labels
gh pr edit $PR_NUMBER --add-label "skill-deployment,claude-code-integration"

# Assign reviewer
gh pr edit $PR_NUMBER --add-assignee @allsxxing
```

## Complete Workflow Example

Here's a complete example deploying the `xai-assessment-protocol` skill:

```bash
# Step 1: Discover new skills
./scripts/discover-skills.sh
# Output shows: ✓ xai-assessment-protocol (new, valid)

# Step 2: Validate the skill
./scripts/validate-skill.sh ~/Library/CloudStorage/GoogleDrive-/My\ Drive/✴️Claude/Claude_skills/xai-assessment-protocol
# Output shows: ✓ VALIDATION PASSED

# Step 3: Deploy (dry run first)
./scripts/deploy-skill.sh xai-assessment-protocol --dry-run
# Review what would happen

# Step 4: Deploy for real
./scripts/deploy-skill.sh xai-assessment-protocol

# Step 5: Create branch and commit
git checkout -b xai-assessment-protocol
git commit -m "Add xai-assessment-protocol v3.0 skill"
git push origin xai-assessment-protocol

# Step 6: Create PR
gh pr create \
  --title "Add xai-assessment-protocol v3.0 skill" \
  --body "Deploys xai-assessment-protocol v3.0..." \
  --base main \
  --head xai-assessment-protocol

# Step 7: Label and assign
gh pr edit 1 --add-label "skill-deployment" --add-assignee @allsxxing
```

## Agent Responsibilities

### ✅ GitHub Agent Owns:
- Skill discovery in Google Drive
- Structure validation
- Branch creation
- PR management
- Repository documentation
- Skill registry updates

### ⏸️ Claude Code Agent Owns:
- Executing deployment scripts
- Local testing
- File verification
- Commit execution

## Troubleshooting

### Google Drive Not Mounted
```bash
# Check if directory exists
ls -la ~/Library/CloudStorage/GoogleDrive-/My\ Drive/✴️Claude/

# If not, enable Google Drive CloudSync in Drive preferences
```

### Skill Already Exists
```bash
# Check if skill is already in repository
ls skills/ | grep [skill-name]

# If exists, use git to update instead of deploy script
```

### Branch Already Exists
```bash
# Switch to existing branch
git checkout [skill-name]

# Or delete and recreate
git branch -D [skill-name]
git checkout -b [skill-name]
```

## Success Criteria Checklist

- [ ] New skill discovered in Google Drive
- [ ] Skill structure validated (SKILL.md, README.md present)
- [ ] Feature branch created
- [ ] Files deployed to `skills/[skill-name]/`
- [ ] Symlink created at `.claude/skills/[skill-name]`
- [ ] Changes committed to feature branch
- [ ] Branch pushed to remote
- [ ] Pull request created
- [ ] Labels and reviewers assigned
- [ ] Skill registry updated

## Related Documentation

- [Deployment Workflow](./DEPLOYMENT_WORKFLOW.md) - Complete deployment guide
- [Skill Registry](./SKILL_REGISTRY.md) - Track all skills
- [Repository README](../README.md) - Main repository documentation
