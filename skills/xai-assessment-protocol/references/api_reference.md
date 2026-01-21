# Codespaces Integration Reference

This document provides detailed information about using GitHub Codespaces with the skills system.

## Codespaces Overview

GitHub Codespaces provides cloud-hosted development environments that allow you to work on skills from any device with a web browser.

## Environment Configuration

### Default Configuration

Codespaces environments include:
- Ubuntu-based container
- Node.js 18+
- Python 3.10+
- Git and GitHub CLI

### Skills-Specific Dependencies

After launching a Codespace, run the setup script to install skill-specific dependencies:

```bash
bash scripts/setup-codespaces.sh
```

This installs:
- **pandoc** - Document conversion
- **libreoffice** - Office document processing
- **poppler-utils** - PDF tools
- **docx, pptxgenjs** - Document generation
- **playwright** - Browser automation
- **defusedxml, pillow** - Python utilities

## Pull Script Reference

### pull-skill.py

**Synopsis:**
```
python pull-skill.py <source> --output <destination>
```

**Parameters:**
- `source` - The skill source location (required)
  - GitHub URL: `https://github.com/owner/repo/tree/branch/path/to/skill`
  - Local path: `/path/to/skill` or `relative/path/to/skill`
  - Remote URL: `https://example.com/skill.skill`
- `--output`, `-o` - Destination directory (required)

**Supported Source Types:**
1. **GitHub URLs** - Automatically downloads repository archive and extracts skill
2. **Local directories** - Copies skill directory to destination
3. **Skill packages** - Extracts `.skill` files (zip format)

**Examples:**
```bash
# From GitHub
python pull-skill.py https://github.com/anthropics/skills/tree/main/skills/docx --output skills/

# From local path
python pull-skill.py ../other-repo/skills/my-skill --output skills/

# From packaged skill
python pull-skill.py https://example.com/custom.skill --output skills/
```

## Validate Script Reference

### validate-skill.py

**Synopsis:**
```
python validate-skill.py <skill-path>
```

**Validation Checks:**
1. Directory structure compliance
2. SKILL.md existence and format
3. YAML frontmatter validity
4. Required fields (name, description)
5. Naming conventions (lowercase, hyphenated)

**Exit Codes:**
- `0` - Validation passed
- `1` - Validation failed

## Troubleshooting Guide

### Common Issues

**Permission Denied**
```bash
chmod +x scripts/*.sh scripts/*.py
```

**Python Module Not Found**
```bash
pip install <missing-module>
```

**Network Timeout**
Increase timeout or use local copy of the skill.

**Skill Validation Fails**
Review the error messages and update SKILL.md frontmatter or content accordingly.
