# CLAUDE.md

## Repository Overview

This is Anthropic's **Skills** repository — a collection of modular instruction packages that extend Claude's capabilities for specialized tasks. Skills are folders of instructions, scripts, and resources that Claude loads dynamically to perform domain-specific work such as document creation, web testing, MCP server development, and creative applications.

- Specification: [agentskills.io](https://agentskills.io)
- Documentation: [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)

## Directory Structure

```
skills/                    # Root
├── skills/                # All skill implementations (16 skills)
│   ├── algorithmic-art/   # Generative art with p5.js
│   ├── brand-guidelines/  # Anthropic brand identity
│   ├── canvas-design/     # Visual design (PDF/PNG output)
│   ├── doc-coauthoring/   # Collaborative documentation workflow
│   ├── docx/              # Word document create/edit (source-available)
│   ├── frontend-design/   # Web design & components
│   ├── internal-comms/    # Internal communication templates
│   ├── mcp-builder/       # MCP server development
│   ├── pdf/               # PDF processing (source-available)
│   ├── pptx/              # PowerPoint create/edit (source-available)
│   ├── skill-creator/     # Meta-skill for creating new skills
│   ├── slack-gif-creator/ # Animated GIF creation for Slack
│   ├── theme-factory/     # Presentation themes
│   ├── web-artifacts-builder/ # React/Tailwind artifact builder
│   ├── webapp-testing/    # Playwright web testing
│   └── xlsx/              # Excel operations (source-available)
├── spec/                  # Agent Skills specification (points to agentskills.io)
├── template/              # Starter SKILL.md template
├── .claude-plugin/        # Plugin marketplace config (marketplace.json)
├── .github/               # GitHub config (copilot-instructions.md)
└── .agents/               # Agent-specific skill configs (firecrawl)
```

## Skill Architecture

Every skill follows this structure:

```
skills/<skill-name>/
├── SKILL.md          # Required: YAML frontmatter + markdown instructions
├── LICENSE.txt       # License terms
├── scripts/          # Optional: Executable code (Python/JS/Bash)
├── references/       # Optional: Long-form documentation loaded as needed
└── assets/           # Optional: Templates, fonts, media for output
```

**Progressive disclosure** is the core pattern:
1. `name` + `description` in YAML frontmatter — always in context (~100 words)
2. SKILL.md body — loaded when skill triggers (keep under 500 lines / 5k words)
3. Bundled resources — loaded or executed on demand (scripts can run without reading)

## Skill Categories

### Document Skills (source-available, proprietary license)
| Skill | Purpose | Key Libraries |
|-------|---------|---------------|
| `docx` | Word document creation and editing with tracked changes | docx-js (create), Python OOXML/Document library (edit) |
| `pdf` | PDF extraction, creation, merging, forms | pypdf, pdfplumber, reportlab, pypdfium2 |
| `pptx` | PowerPoint creation and editing | html2pptx.js (create), OOXML editing (edit) |
| `xlsx` | Excel spreadsheet operations with formulas | openpyxl, pandas |

### Development Skills (Apache 2.0)
| Skill | Purpose |
|-------|---------|
| `mcp-builder` | Build MCP servers (TypeScript + streamable HTTP preferred) |
| `webapp-testing` | Playwright web automation with `with_server.py` lifecycle wrapper |
| `skill-creator` | Meta-skill for creating new skills |
| `web-artifacts-builder` | React/Tailwind/Vite/shadcn single-file HTML artifacts |

### Creative & Design Skills
| Skill | Purpose |
|-------|---------|
| `algorithmic-art` | Generative art with p5.js (seeded randomness, parametric) |
| `canvas-design` | Visual PDF/PNG design with licensed fonts |
| `frontend-design` | Production-grade web interfaces |
| `brand-guidelines` | Anthropic brand identity (colors, typography) |
| `theme-factory` | 10 pre-set + custom presentation themes |
| `slack-gif-creator` | Slack-optimized animated GIFs |

### Communication Skills
| Skill | Purpose |
|-------|---------|
| `doc-coauthoring` | Structured documentation co-authoring workflow |
| `internal-comms` | Templates for 3P updates, newsletters, FAQs, reports |

## Critical Workflows

### OOXML Document Editing (docx/pptx/xlsx)

```bash
python ooxml/scripts/unpack.py <file> <dir>       # Unpack Office file
# Edit XML directly or use Document library
python ooxml/scripts/validate.py <dir> --original <file>  # Validate (pptx only)
python ooxml/scripts/pack.py <dir> <file>          # Repack
```

**Document library pattern** (docx/pptx):
```python
from scripts.document import Document
doc = Document.load('unpacked/word/document.xml')
node = doc.get_node('w:p', content_contains='target text')
# Manipulate DOM
doc.save('unpacked/word/document.xml')
```

### DOCX Tracked Changes (Redlining)

1. Convert to markdown: `pandoc --track-changes=all file.docx -o current.md`
2. Group changes into batches of 3-10
3. Read `skills/docx/ooxml.md` entirely before editing
4. For each batch: grep XML, implement with Document library, test
5. Pack final document

**Key principle**: Only mark text that changed; preserve original `<w:r>` elements and RSIDs for unchanged text.

### MCP Server Development

- **Preferred stack**: TypeScript + streamable HTTP (stateless, scales better than stdio)
- **References**: `skills/mcp-builder/reference/` — `mcp_best_practices.md`, `node_mcp_server.md`, `python_mcp_server.md`
- **Design priority**: Comprehensive API coverage over specialized workflows

### Web Testing (Playwright)

- Wrap app lifecycle with `scripts/with_server.py`
- Always wait for `networkidle` before DOM inspection on dynamic apps
- Pattern: navigate → wait networkidle → screenshot/DOM → identify selectors → execute

### Web Artifacts Builder

```bash
bash scripts/init-artifact.sh <name>     # Initialize React/Vite project
bash scripts/bundle-artifact.sh          # Bundle to single HTML file
```

Stack: React 18 + TypeScript + Vite + Parcel + Tailwind CSS + shadcn/ui (40+ components)

## Development Conventions

### Skill Authoring Rules
- **Conciseness first**: Challenge every paragraph. Keep SKILL.md under 500 lines / 5k words.
- **No redundant docs**: Do not create extra READMEs or auxiliary docs inside skills. Use SKILL.md only for instructions.
- **Progressive disclosure**: Move long-form content into `references/` files (under ~10k words each). Move executable logic into `scripts/`.
- **New skills**: Start from `template/SKILL.md` or mirror `skills/skill-creator/SKILL.md`.
- **Reuse utilities**: Use existing `scripts/utilities.py` and `scripts/document.py` where possible.

### Licensing
- Most skills: **Apache 2.0** (see LICENSE.txt in each skill)
- Document skills (docx, pdf, pptx, xlsx): **Source-available / proprietary** — do not redistribute

### Code Style
- Python scripts: Include `--help` flags and docstrings
- Scripts should be executable and self-contained
- Prefer running scripts with `--help` before reading internals

## Plugin Marketplace

The repository is distributed via `.claude-plugin/marketplace.json` as two plugin bundles:

1. **document-skills**: docx, pdf, pptx, xlsx
2. **example-skills**: All other skills (algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring, frontend-design, internal-comms, mcp-builder, skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder, webapp-testing)

Install in Claude Code:
```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

## Environment Setup

### Quick Setup (CodeSpaces)

Run the one-liner from `ULTRA-COMPACT-ONELINER.txt` or install manually:

```bash
# System packages
sudo apt-get install -y pandoc libreoffice poppler-utils

# Node.js packages
npm install -g docx pptxgenjs playwright react-icons react react-dom sharp

# Python packages
pip install defusedxml pillow imageio imageio-ffmpeg numpy anthropic mcp "markitdown[pptx]"

# Playwright browser
playwright install chromium --with-deps
```

### Verification

```bash
pandoc --version && libreoffice --version && pdftoppm -v
npm list -g docx playwright pptxgenjs
pip list | grep -E "defusedxml|pillow|anthropic|mcp"
```

## Testing & Validation

There is no monorepo test runner. Validation is skill-specific:

- **Document workflows**: Unpack → edit → pack; for pptx run `validate.py`
- **Web testing**: Use `with_server.py` wrapper plus test script; ensure server port matches flag
- **Excel**: Always run `python recalc.py output.xlsx` after formula creation to verify zero formula errors
- **Scripts**: Keep executable and include minimal usage examples

## Common Commands

```bash
# DOCX text extraction
pandoc --track-changes=all input.docx -o output.md

# PPTX thumbnails
python scripts/thumbnail.py presentation.pptx --cols 4

# OOXML operations
python ooxml/scripts/unpack.py <file> <dir>
python ooxml/scripts/validate.py <dir> --original <file>
python ooxml/scripts/pack.py <dir> <file>

# Excel formula recalculation
python recalc.py output.xlsx

# Web artifact bundling
bash scripts/init-artifact.sh <name>
bash scripts/bundle-artifact.sh
```

## Key References

- Specification: [agentskills.io/specification](https://agentskills.io/specification)
- DOCX creation reference: `skills/docx/docx-js.md`
- DOCX editing reference: `skills/docx/ooxml.md`
- PPTX OOXML reference: `skills/pptx/ooxml.md`
- PPTX creation reference: `skills/pptx/html2pptx.md`
- PDF reference: `skills/pdf/reference.md`
- MCP best practices: `skills/mcp-builder/reference/mcp_best_practices.md`
- Skill creation guide: `skills/skill-creator/SKILL.md`
