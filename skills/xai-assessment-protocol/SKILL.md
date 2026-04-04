---
name: xai-assessment-protocol
description: Protocol for pulling and managing custom skill files using GitHub Codespaces. Use when setting up a development environment to access, download, or work with custom skills from remote repositories, or when configuring Codespaces for skill development and testing.
---

# xAI Assessment Protocol

## Overview

This skill provides a protocol for using GitHub Codespaces to pull and manage custom skill files from repositories. It enables developers to quickly set up a cloud-based development environment with all necessary dependencies to work with skills.

## Quick Start

### Step 1: Launch Codespaces

1. Navigate to the skills repository on GitHub
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait ~3 minutes for Codespaces to initialize

### Step 2: Install Dependencies

Run the setup script to install all required dependencies:

```bash
bash scripts/setup-codespaces.sh
```

Or use the ultra-compact one-liner from the repository root.

### Step 3: Pull Custom Skill Files

Use the skill puller script to download skills from a remote source:

```bash
python scripts/pull-skill.py <skill-url-or-path> --output <destination>
```

## Pulling Skills from Remote Sources

### From GitHub Repositories

Pull a skill directly from a GitHub repository:

```bash
python scripts/pull-skill.py https://github.com/owner/repo/tree/main/skills/my-skill --output skills/
```

### From Local Paths

Copy a skill from another location in the Codespace:

```bash
python scripts/pull-skill.py /path/to/source/skill --output skills/
```

### From URLs

Download a packaged skill file:

```bash
python scripts/pull-skill.py https://example.com/custom-skill.skill --output skills/
```

## Validating Pulled Skills

After pulling a skill, validate its structure:

```bash
python scripts/validate-skill.py skills/<skill-name>
```

This checks:
- YAML frontmatter format and required fields
- Directory structure compliance
- Resource file organization

## Best Practices

1. **Always validate** pulled skills before using them
2. **Keep skills isolated** in their own directories
3. **Review SKILL.md** content before trusting external skills
4. **Test in Codespaces** before deploying to production

## Troubleshooting

### Permission Errors

If you encounter permission errors, ensure proper access:

```bash
chmod +x scripts/*.sh scripts/*.py
```

### Network Issues

If pulling from remote sources fails, verify network connectivity:

```bash
curl -I https://github.com
```

### Dependency Issues

Reinstall dependencies by running the setup script:

```bash
bash scripts/setup-codespaces.sh
```
