# Cloudflare Workers — Git-Connected CI/CD
<!-- Module: deployment/cloudflare-workers.md -->

## Worker Details

| Property | Value |
|----------|-------|
| Worker Name | `casino` |
| Worker ID | `6f09fd3ff99a4a7181fcba4cb701d4b2` |
| Account ID | `b7930049da7d0a37b605302447719fe5` |
| URL | `https://casino.all-seeing-eyes.workers.dev/` |
| Dashboard | [Settings](https://dash.cloudflare.com/b7930049da7d0a37b605302447719fe5/workers/services/view/casino/production/settings) |
| Health | `GET /health` → JSON status |

---

## Git Integration (Workers Builds)

Workers Builds connects the `casino` worker to `allsxxing/skills` on GitHub. Every push triggers auto build + deploy.

### Setup (One-Time via CF Dashboard)

1. Go to CF Dashboard → Workers & Pages → `casino` → Settings → **Builds**
2. Click **Connect** → authorize GitHub
3. Select repository: **`allsxxing/skills`**
4. Configure build settings:
   - **Git branch:** `main` (merge the casino branch first)
   - **Root directory:** `workers/casino`
   - **Build command:** _(leave empty — no build step needed)_
   - **Deploy command:** `npx wrangler deploy`
5. Push a commit to trigger the first build

### Deploy Flow

```
git push → GitHub webhook → Workers Builds → wrangler deploy → live ~60s
```

1. Skill generates protocol HTML for target date
2. Updates `workers/casino/src/worker.js` with new `PROTOCOL_HTML` content
3. Commits + pushes to `allsxxing/skills` repo
4. Workers Builds detects push, runs deploy command
5. Worker goes live at `casino.all-seeing-eyes.workers.dev`

---

## Cron Triggers (Scheduled Events)

Fire every Thu/Fri/Sat at noon CT (18:00 UTC) — aligned with Mom's bus schedule.

### wrangler.toml Config
```toml
name = "casino"
main = "src/worker.js"
compatibility_date = "2024-09-23"

[triggers]
crons = [
  "0 18 * * 4",   # Thursday  12:00 PM CT
  "0 18 * * 5",   # Friday    12:00 PM CT
  "0 18 * * 6"    # Saturday  12:00 PM CT
]

[observability]
enabled = true
```

### Worker Handlers

**`fetch`** — Serves the current protocol HTML card.
**`scheduled`** — Fires on cron. Currently logs. Future: KV refresh, D1 analytics, push notifications.

---

## Repo Structure

```
allsxxing/skills/
├── skills/mom-casino-bus-protocol/   ← skill modules
│   ├── SKILL.md
│   ├── data/
│   ├── design/
│   ├── deployment/
│   └── output/
└── workers/casino/                   ← CF Worker source
    ├── wrangler.toml
    ├── package.json
    └── src/worker.js
```

---

## Manual Deploy (Fallback)

If Workers Builds is not connected:
```bash
cd workers/casino
npm install
npx wrangler deploy
```
