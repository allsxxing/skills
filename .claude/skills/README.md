# Claude Skills Local Integration

This directory contains symlinks to skills in the `skills/` directory for local Claude Code integration.

## Structure
Each skill should have a symlink here pointing to `../../skills/[skill-name]/`:
```
.claude/skills/
├── docx → ../../skills/docx
├── pdf → ../../skills/pdf
├── pptx → ../../skills/pptx
└── xlsx → ../../skills/xlsx
```

## Purpose
These symlinks enable Claude Code to discover and load skills from the local repository during development and testing.

## Automated Deployment
When deploying new skills via the GitHub Agent workflow, symlinks are automatically created by the deployment scripts.
