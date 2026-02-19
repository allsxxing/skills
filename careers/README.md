# xAI Careers MCP Server

Real-time MCP knowledge base for all remote roles at [x.ai](https://x.ai/careers/open-roles?location=remote). Scrapes, parses, stores, and exposes xAI job listings as MCP tools for Claude Desktop and Claude Code.

## Setup

```bash
# Clone and install
cd careers
npm install

# Install Playwright browser
npx playwright install chromium

# Run initial scrape
npm run scrape

# Start MCP server
npm start
```

## Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "xai-careers": {
      "command": "node",
      "args": ["/absolute/path/to/careers/index.js"],
      "env": {}
    }
  }
}
```

## MCP Tools

### `search_roles`
Search xAI remote roles by keyword, department, employment type, or required skill.

**Input:**
```json
{ "query": "ML engineer", "department": "Research", "limit": 10 }
```
**Output:** Array of matching roles with ID, title, department, location, requirements snippet, technical intensity score, and priority flags.

### `get_role_detail`
Return full details of a specific xAI role by title or ID.

**Input:**
```json
{ "role_id": "senior-ml-engineer-research" }
```
**Output:** Complete role object with description, requirements array, nice-to-have qualifications, technical intensity score, xAI context metadata.

### `list_recent_roles`
List xAI remote roles added or updated in the last N days.

**Input:**
```json
{ "days": 7 }
```
**Output:** Sorted array of roles with `is_new` and `is_updated` flags, most recent first.

### `analyze_trends`
Analyze patterns and frequency across all current xAI remote roles.

**Input:**
```json
{ "dimension": "skills" }
```
**Dimensions:** `skills`, `departments`, `keywords`, `role_types`, `priority_flags`

**Output:** Frequency table with counts and percentage breakdown, sorted by count descending.

### `compare_roles`
Side-by-side structured comparison of two xAI roles.

**Input:**
```json
{ "role_a": "senior-ml-engineer-research", "role_b": "infrastructure-engineer-engineering" }
```
**Output:** Structured diff with shared requirements, unique qualifications, department/score differences.

### `trigger_scrape`
Manually trigger a fresh scrape of x.ai/careers and sync the knowledge base.

**Input:** `{}` (no params)

**Output:** Scrape stats: `{ roles_total, roles_new, roles_updated, roles_removed, status }`

## Resources

| URI | Description |
|-----|-------------|
| `xai://careers/all` | All roles in the database as JSON |
| `xai://careers/snapshot/latest` | Most recent JSON snapshot from last scrape |
| `xai://careers/scrape-log` | Last 10 scrape execution logs |

## Automation

A GitHub Actions workflow (`.github/workflows/scrape-sync.yml`) runs every 6 hours to:

1. Launch headless Chromium via Playwright
2. Scrape all remote role listings from x.ai/careers
3. Upsert roles into the SQLite knowledge base
4. Save a timestamped JSON snapshot to `data/snapshots/`
5. Commit and push the snapshot to the repository

Manual trigger is available via the GitHub Actions UI (`workflow_dispatch`).

## Knowledge Base

### XAI_CONTEXT Layer

The server includes an intelligence layer (`config.js`) with domain knowledge about xAI:

- **Company context:** Mission, founder, flagship product (Grok), competitors, platform integrations
- **Tech stack signals:** 17 tracked technologies (CUDA, PyTorch, JAX, Rust, C++, etc.)
- **Priority signals:** 8 key focus areas (Grok, inference, post-training, safety, multimodal, etc.)
- **Hiring pattern notes:** Behavioral patterns in xAI's hiring practices

### Technical Intensity Score

Each role receives a `technicalIntensityScore` (1-10) computed by counting matches against tracked tech stack signals in the role's title, description, and requirements. Roles matching 3+ priority signals are flagged as `HIGH_PRIORITY`.

### Database Schema

- **`roles` table:** 15 columns including title, department, location, description, requirements, nice-to-have, posted date, scrape timestamps, and change flags
- **`scrape_log` table:** Execution history with stats per run
- **SQLite** via `better-sqlite3` with WAL mode for concurrent reads

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start MCP server (stdio transport) |
| `npm run scrape` | Run standalone scrape |
| `npm run dev` | Start with nodemon (auto-restart on changes) |
