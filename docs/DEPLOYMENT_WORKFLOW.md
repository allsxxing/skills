# Skill Deployment Workflow

This document describes the GitHub Agent workflow for managing skill deployments from Google Drive to the `allsxxing/skills` repository.

## Overview

The deployment workflow consists of three phases:
1. **Skill Discovery & Validation** - Identify new skills in Google Drive
2. **Branch Creation & Planning** - Create feature branches and plan deployment
3. **Post-Deployment GitHub Management** - Create PRs and manage workflow

## Prerequisites

- Google Drive CloudSync mounted at: `~/Library/CloudStorage/GoogleDrive-/My Drive/✴️Claude/Claude_skills/`
- Git repository cloned locally
- GitHub CLI (`gh`) installed for PR management
- Bash shell environment

## Phase 1: Skill Discovery & Validation

### Step 1: Discover New Skills

Use the discovery script to find skills in Google Drive that aren't yet in the repository:

```bash
./scripts/discover-skills.sh
```

For detailed output:

```bash
./scripts/discover-skills.sh --verbose
```

The script will:
- List all skills in Google Drive
- Compare with skills already in the repository
- Identify new skills ready for deployment
- Validate skill structure (SKILL.md, README.md, etc.)

### Step 2: Validate Specific Skill

Before deploying, validate a specific skill's structure:

```bash
./scripts/validate-skill.sh ~/Library/CloudStorage/GoogleDrive-/My\ Drive/✴️Claude/Claude_skills/[skill-name]
```

This checks for:
- ✓ SKILL.md (REQUIRED)
- ✓ README.md (REQUIRED)
- ○ CHANGELOG.md (optional)
- ○ Data payload `.json` files (optional)

## Phase 2: Branch Creation & Deployment

### Step 1: Create Feature Branch

For each new skill, create a dedicated feature branch:

```bash
git checkout -b [skill-name]
```

Example:
```bash
git checkout -b xai-assessment-protocol
```

### Step 2: Deploy Skill

Use the deployment script to copy files and create symlinks:

```bash
# Dry run first to see what will happen
./scripts/deploy-skill.sh [skill-name] --dry-run

# Perform actual deployment
./scripts/deploy-skill.sh [skill-name]
```

The deployment script will:
1. Validate skill structure
2. Copy files from Google Drive to `skills/[skill-name]/`
3. Create symlink at `.claude/skills/[skill-name]` → `../../skills/[skill-name]`
4. Display next steps for git workflow

### Step 3: Commit and Push Changes

```bash
# Review changes
git status
git diff

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add [skill-name] v[version] skill"

# Push to remote
git push origin [skill-name]
```

## Phase 3: Pull Request Management

### Step 1: Create Pull Request

Use GitHub CLI to create a PR:

```bash
gh pr create \
  --title "Add [skill-name] v[version] skill" \
  --body "Deploys [skill-name] v[version] as a Claude skill with local Claude Code integration.

## Files Added
- \`skills/[skill-name]/\` – Skill definition & resources
- \`.claude/skills/[skill-name]\` – Local Claude Code symlink

## Integration Points
- **Claude Code:** Via \`.claude/skills/\` local registry
- **Claude.ai:** Ready for publication

## Verification Checklist
- [ ] All skill files present in \`skills/[skill-name]/\`
- [ ] Symlink active at \`.claude/skills/[skill-name]\`
- [ ] SKILL.md validates per anthropics/skills standard
- [ ] README.md documents usage
- [ ] CHANGELOG.md tracks version (if present)
- [ ] No merge conflicts" \
  --base main \
  --head [skill-name]
```

### Step 2: Add Labels and Reviewers

```bash
# Get PR number from previous step output
PR_NUMBER=[number]

# Add labels
gh pr edit $PR_NUMBER --add-label "skill-deployment,claude-code-integration"

# Add assignee
gh pr edit $PR_NUMBER --add-assignee @allsxxing
```

### Step 3: Update Skill Registry

After PR is created, update the skill registry:

```bash
# Edit docs/SKILL_REGISTRY.md
# Add entry for the new skill
```

## Repository Structure

After deployment, the repository structure will be:

```
allsxxing/skills/
├── skills/
│   └── [skill-name]/
│       ├── SKILL.md
│       ├── README.md
│       ├── CHANGELOG.md
│       └── [other files]
├── .claude/
│   └── skills/
│       └── [skill-name] → ../../skills/[skill-name]
└── docs/
    ├── DEPLOYMENT_WORKFLOW.md
    └── SKILL_REGISTRY.md
```

## Troubleshooting

### Google Drive Not Mounted

If you get "Google Drive CloudSync not mounted":

1. Verify Google Drive is installed
2. Check CloudSync is enabled in Google Drive settings
3. Confirm the skills directory exists in your Google Drive

### Branch Already Exists

If the branch already exists:

```bash
# Switch to existing branch
git checkout [skill-name]

# Pull latest changes
git pull origin [skill-name]

# Continue with deployment
```

### PR Already Exists

If PR already exists for the branch:

```bash
# List open PRs for this branch
gh pr list --state open --head [skill-name]

# Update existing PR with new commits
git push origin [skill-name]
```

## Coordination with Claude Code Agent

The GitHub Agent workflow is designed to coordinate with Claude Code Agent:

**GitHub Agent Responsibilities:**
- Skill discovery in Google Drive
- Branch creation
- PR management
- Documentation updates

**Claude Code Agent Responsibilities:**
- Execute deployment scripts
- File synchronization
- Local testing and validation
- Commit and push execution

## Success Criteria

✅ Deployment is successful when:

- [ ] All new skills discovered in Google Drive
- [ ] Skill structure validated (required files present)
- [ ] Feature branch created for skill
- [ ] Files copied to `skills/[skill-name]/`
- [ ] Symlink created at `.claude/skills/[skill-name]`
- [ ] Changes committed to feature branch
- [ ] Branch pushed to remote
- [ ] Pull request created with metadata
- [ ] Labels and reviewers assigned
- [ ] Skill registry updated

## Additional Resources

- [Skills Repository README](../README.md)
- [Skill Registry](./SKILL_REGISTRY.md)
- [Agent Skills Specification](https://agentskills.io)
- [Creating Custom Skills](https://support.claude.com/en/articles/12512198-creating-custom-skills)
