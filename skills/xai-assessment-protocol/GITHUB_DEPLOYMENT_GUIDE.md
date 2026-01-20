# GitHub Deployment Guide - xAI Assessment Skill

## Directory Structure for allsxxing/skills Repo

```
allsxxing/skills/
└── xai-assessment-protocol/
    ├── SKILL.md                                              # Main skill file (REQUIRED)
    ├── xAI_Assessment_Protocol-v3.0_DATA_011626.json        # Structured data
    ├── xAI_Assessment_Protocol-v3.0_QUICK_REFERENCE_011626.txt  # Plain text backup
    ├── README.md                                             # Documentation
    └── CHANGELOG.md                                          # Version history
```

## Git Commands to Deploy

### Option 1: Create New Branch (Recommended)

```bash
# Navigate to your skills repo
cd ~/path/to/allsxxing/skills

# Create and checkout new branch
git checkout -b xai-assessment-protocol

# Create the skill directory
mkdir -p xai-assessment-protocol

# Copy the generated files into the directory
# (Download the 5 files from this conversation first)
cp ~/Downloads/SKILL.md xai-assessment-protocol/
cp ~/Downloads/xAI_Assessment_Protocol-v3.0_DATA_011626.json xai-assessment-protocol/
cp ~/Downloads/xAI_Assessment_Protocol-v3.0_QUICK_REFERENCE_011626.txt xai-assessment-protocol/
cp ~/Downloads/README.md xai-assessment-protocol/
cp ~/Downloads/CHANGELOG.md xai-assessment-protocol/

# Add all files
git add xai-assessment-protocol/

# Commit with descriptive message
git commit -m "Add xAI Assessment Protocol v3.0 Skill

- Mobile-optimized cheat sheet for 90-min xAI Vision Assessment
- Dual codeblock format for tap-copy efficiency
- Proper Claude Skill architecture with YAML frontmatter
- Phases: Text fields, Inspiration pieces, Personal portfolio, Alternates
- Combat protocols for technical troubleshooting
- Compatible with Claude Code, Claude.ai, and Claude API"

# Push to remote
git push origin xai-assessment-protocol
```

### Option 2: Add to Main Branch

```bash
# If you want to add directly to main instead
git checkout main
mkdir -p xai-assessment-protocol
# ... copy files as above ...
git add xai-assessment-protocol/
git commit -m "Add xAI Assessment Protocol v3.0 Skill"
git push origin main
```

## Claude Code Setup

Once pushed to GitHub, use the skill in Claude Code:

### Method 1: Clone to Local Skills Directory

```bash
# Navigate to Claude Code skills directory
cd ~/.claude/skills/

# Clone just the skill subdirectory (if using sparse checkout)
git clone --depth 1 --filter=blob:none --sparse https://github.com/allsxxing/skills.git
cd skills
git sparse-checkout set xai-assessment-protocol

# Or clone entire repo and symlink
cd ~/.claude/skills/
git clone https://github.com/allsxxing/skills.git
ln -s skills/xai-assessment-protocol ./xai-assessment-protocol
```

### Method 2: Project-Specific Skill

```bash
# In your project directory
mkdir -p .claude/skills/
cd .claude/skills/

# Copy or symlink the skill
cp -r ~/path/to/allsxxing/skills/xai-assessment-protocol ./
# OR
ln -s ~/path/to/allsxxing/skills/xai-assessment-protocol ./xai-assessment-protocol
```

## Verify Installation

After setup, verify the skill is detected:

```bash
# In Claude Code, the skill should appear when you:
# 1. Start a new chat
# 2. Type: "Run the xAI Assessment Cheat Sheet protocol"
# 3. Claude should load SKILL.md and provide the formatted content
```

## Privacy Note

- **Branch privacy:** Branches inherit repo visibility
- **If allsxxing/skills is public:** This branch will be public
- **To make private:** Either make entire repo private OR create separate private repo
- **Current status:** Per your note, public branch is acceptable for personal use

---

**Last Updated:** January 20, 2026  
**Maintained By:** GJ Bordallo (@allsxxing / All Seeing Eyes)
