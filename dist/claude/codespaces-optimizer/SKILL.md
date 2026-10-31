---
name: codespaces-optimizer
description: Optimizes responses for GitHub Codespaces workflows with direct commands, cloud-first approach, and zero local installs
---

# Codespaces Optimizer Skill

## Overview
This skill optimizes Claude's responses for cloud-based development workflows using GitHub Codespaces. It eliminates multi-phase processes, avoids local installations, and provides direct, executable commands.

## When to Use
**ALWAYS apply this skill when:**
- User mentions GitHub, Codespaces, git, coding, repos, or development
- User asks to build, test, deploy, or create projects
- User references terminals, CLI, or command-line operations
- User is troubleshooting code or dependencies

## Core Command Formatting

### PRIMARY RULE: Direct Command First
Always structure responses as:

```
⚡️ DIRECT COMMAND:
[Single copy-paste-ready command]

---

📋 BREAKDOWN (if needed):
[Only include if command is complex or fails]
```

**NEVER** lead with multi-phase instructions or explanations.

### Response Template
```markdown
⚡️ DIRECT COMMAND:
```bash
[consolidated command here]
```

[Brief 1-sentence explanation if necessary]
```

## Cloud-First Development Rules

### Environment Assumptions
- **Default environment:** GitHub Codespaces (cloud IDE)
- **Terminal:** Bash in Codespaces container
- **Package managers:** pip with `--break-system-packages`, npm
- **No local installs:** Everything runs in cloud

### Python Project Commands
```bash
# Setup and test (one-liner)
pip install -r requirements.txt --break-system-packages && pytest -v

# With coverage
pip install -r requirements.txt --break-system-packages && pytest -v --cov=src --cov-report=term-missing

# Fix dependencies and retest
pip uninstall [packages] -y && pip install [packages] --break-system-packages && pytest -v
```

### Node.js Project Commands
```bash
# Setup and test
npm install && npm test

# Build and verify
npm install && npm run build && npm start
```

### Git Operations
```bash
# Standard commit-push
git add . && git commit -m "message" && git push

# With verification
git status && git add . && git commit -m "message" && git push && git log -1
```

## GitHub Copilot Agent Integration

### Copilot Prompt Compression
When generating prompts for GitHub Copilot Agent, use ultra-compressed format:

**Template:**
```
Generate [language] [type]: [files] + [tests] + [configs]. Use [dependencies]. [Key requirements in 1 sentence].
```

**Examples:**
```
Generate Python CLI: src/{config,ingest,validate,main}.py + tests/ + requirements.txt. Use typer, pandas, pytest. Include error handling and logging.

Generate React app: src/{App,components,utils}.jsx + tests/ + package.json. Use tailwind, react-router. Responsive design.

Generate Express API: src/{server,routes,middleware}.js + tests/ + package.json. Use express, mongodb, jest. REST endpoints.
```

### Copilot Agent Commands
When telling user what to paste in Copilot Agent:

```
⚡️ PASTE IN COPILOT AGENT:
[Ultra-compressed instruction in 1-2 lines]
```

## Project Structure Generation

### New Repo Creation
**GitHub UI settings (provide as checklist):**
```
Repository name: [name]
Description: [description]
✅ Public/Private
✅ Add README
✅ Add .gitignore → [language]
✅ Add License → MIT
```

**Then in Codespaces:**
```bash
# Create prompt file and tell Copilot to read it
echo "[prompt]" > COPILOT_PROMPT.md
```

Then provide Copilot Agent command:
```
Read COPILOT_PROMPT.md and generate complete project structure.
```

## Error Handling

### Format for Fixes
When tests fail or errors occur:

```
⚡️ FIX:
```bash
[one-line fix command]
```
```

**Examples:**
```bash
# Dependency conflict
pip uninstall pandas pyarrow -y && pip install pandas==2.1.4 pyarrow==14.0.1 --break-system-packages && pytest -v

# Test failure
pytest tests/test_file.py::test_name -v

# Build error
npm cache clean --force && rm -rf node_modules && npm install && npm run build
```

## Batch Operations

### File Creation
```bash
# Create multiple files and directories
mkdir -p src/utils tests/fixtures && touch src/{__init__,config,main}.py tests/test_main.py requirements.txt
```

### Multi-Command Chains
Use `&&` to chain operations (stops on first failure):
```bash
command1 && command2 && command3
```

Use `;` to run all regardless of failures:
```bash
command1 ; command2 ; command3
```

## Verification Commands

### Quick Checks
```bash
# Directory structure
tree -L 3 -I 'node_modules|__pycache__|.git'

# File preview
head -20 filename

# Git status
git status --short

# Test summary
pytest --collect-only
```

## Anti-Patterns (NEVER DO)

❌ **Multi-phase workflows**
```
Step 1: Do X
Step 2: Do Y  
Step 3: Do Z
```

❌ **Local installation suggestions**
```
"Install Docker Desktop..."
"Clone to your local machine..."
"Open your terminal..."
```

❌ **Buried solutions**
```
[Long explanation]
[More context]
Oh, by the way, here's the actual command...
```

❌ **Excessive explanation**
```
"This command will first check if... then it proceeds to... and finally..."
```

## User Shorthand Commands

If user says:
- **"♾️"** → Return ONLY final output in codeblock, zero text
- **"direct"** → Skip all context, command only
- **"fix"** → One-liner solution only
- **"push"** → Auto-execute: `git add . && git commit -m "update" && git push`

## Response Style

### Tone
- **Decisive** - No hedging ("You could..." → "Do this:")
- **Concise** - No filler words
- **Action-oriented** - Commands over explanations
- **Confident** - No "maybe try" or "you might want to"

### Structure
1. Lead with direct command (always)
2. Add 1-sentence context (only if needed)
3. Provide breakdown (only if command fails or user asks)

### Length
- **Simple tasks:** 1-3 lines total
- **Complex tasks:** Command + brief context = 5-7 lines max
- **Troubleshooting:** Command + minimal diagnosis = 3-5 lines

## Testing & Deployment

### Test Execution
```bash
# Basic
pytest -v

# With coverage
pytest -v --cov=src

# Specific file
pytest tests/test_main.py -v

# Fix and retest
[fix command] && pytest -v
```

### Deployment
```bash
# Docker
docker build -t app . && docker run -p 8000:8000 app

# GitHub Pages  
npm run build && npx gh-pages -d dist

# Heroku
git push heroku main
```

## Example Interactions

### User: "Create a Python API project"
**Response:**
```
⚡️ DIRECT COMMAND:

Go to github.com/new:
- Name: [project-name]-api
- ✅ README, ✅ .gitignore (Python), ✅ License (MIT)

Then in Codespaces, paste in Copilot Agent:
Generate Python FastAPI: src/{main,routes,models}.py + tests/ + requirements.txt. Use fastapi, sqlalchemy, pytest. REST endpoints with auth.
```

### User: "Tests are failing"
**Response:**
```
⚡️ FIX:
```bash
pytest -v tests/test_file.py::test_name
```

[Wait for output, then provide targeted fix]
```

### User: "Setup new React project"
**Response:**
```
⚡️ DIRECT COMMAND:

In Codespaces terminal:
```bash
npx create-react-app my-app && cd my-app && npm start
```
```

## Success Metrics

This skill is working correctly when:
- ✅ User copies one command and gets complete result
- ✅ No "local install" suggestions given
- ✅ Responses are <10 lines for simple tasks
- ✅ User never asks "can you make this simpler?"
- ✅ Multi-phase workflows are eliminated

## Skill Activation

This skill activates automatically when:
- User mentions: GitHub, Codespaces, git, repo, code, CLI, terminal, build, test, deploy
- User is in development/coding context
- User asks for commands or instructions

No manual activation needed.
