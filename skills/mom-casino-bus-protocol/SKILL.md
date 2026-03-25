---
name: mom-casino-bus-protocol
description: Generates a fully personalized, date-specific Casino Bus Night schedule for Mom (Coco) using GG33 numerology, live lunar data, and current astrological transits. Outputs a shareable HTML card styled with the Coco design system — frosted glass cards on a vivid gradient background, animated color spectrum shimmer bars, all windows pre-expanded, download + share buttons included. Deploys automatically to https://casino.all-seeing-eyes.workers.dev/ via Cloudflare Workers Builds (Git-connected CI/CD). Cron triggers fire every Thu/Fri/Sat at noon CT to align with Mom's weekly bus schedule. Use this skill whenever the user says "run the casino protocol", "casino bus", "Mom's schedule", "generate Coco's night", or any similar phrase. Always trigger for casino, bus trip, or Mom's night-out scheduling requests.
---

# MOM CASINO BUS PROTOCOL
<!-- version: 3.0 | updated: 03/25/26 | author: GJ Bordallo · ALL SEEING EYES (@allsxxing) -->

Multi-module skill. Generates a live, date-specific Casino Bus Night breakdown for Mom every time it runs — current, accurate, and auto-deployed via Git push → Cloudflare Workers Builds.

---

## MODULE MAP

| Module | Path | Purpose |
|--------|------|---------|
| Protocol Schema | `data/protocol-schema.md` | Numerology engine, schedule windows, hard rules |
| Batch Config | `data/batch-config.md` | Thu/Fri/Sat frequency, cadence settings |
| Cosmic Context | `data/cosmic-context.md` | Lunar + astro data layer spec |
| Design Tokens | `design/design-tokens.md` | Full CSS token reference — animated spectrum colorway |
| Layout Spec | `design/layout-spec.md` | Card, header, footer, responsive rules |
| Component Library | `design/component-library.md` | Accordion, badges, peak card, cosmic panel |
| Cloudflare Workers | `deployment/cloudflare-workers.md` | Git-connected Builds, cron triggers, CI/CD pipeline |
| Env Variables | `deployment/env-variables.md` | Required secrets and bindings |
| HTML Template | `output/html-template.md` | Assembled output template (data + design) |

---

## TRIGGER

Activate on any of:
- "Run the casino protocol"
- "Casino bus for [date]"
- "Generate Mom's / Coco's schedule"
- "Casino night [date]"
- "What's the protocol for [date]"

**On trigger:** Ask for date if not provided. Then run all steps without confirmation.

---

## EXECUTION ORDER (EACH RUN)

### 1. Collect Date
Read `data/batch-config.md` — determine if running single date or Thu/Fri/Sat batch.

### 2. Run Data Layer
Read `data/protocol-schema.md` — compute numerology, generate 6 windows, apply BEST LUCK logic.
Read `data/cosmic-context.md` — fetch live lunar + transit data for target date(s).

### 3. Apply Design
Read `design/design-tokens.md` and `design/component-library.md`.
Inject all computed data into the HTML template at `output/html-template.md`.
**Preserve the animated color spectrum shimmer bars and frosted glass aesthetic at all times.**

### 4. Deploy (Automated)
Read `deployment/cloudflare-workers.md` for the Git-connected CI/CD pipeline.

**Default flow:**
1. Generate the HTML with all computed data
2. Update `workers/casino/src/worker.js` with new PROTOCOL_HTML content
3. Push commit to `allsxxing/skills` repo → Workers Builds auto-deploys (~60s)
4. Live at: `https://casino.all-seeing-eyes.workers.dev/`

**Fallback:** If user requests HTML-only, export as `CasinoBusProtocol_Coco_MMDDYY.html`

---

## AUTOMATED WEEKLY SCHEDULE

The Cloudflare Worker has cron triggers that fire every **Thursday, Friday, and Saturday at 12:00 PM CT** (18:00 UTC). This aligns with Mom's weekly casino bus nights.

The full automation pipeline:
1. **Cowork scheduled task** runs weekly on Wed/Thu/Fri mornings
2. Skill generates protocol HTML for upcoming bus night(s)
3. Updated `worker.js` is committed + pushed to `allsxxing/skills` repo
4. **Workers Builds** detects the push and auto-deploys to production
5. **Cron triggers** on the worker fire at noon CT on bus days for logging/monitoring
6. Mom accesses `casino.all-seeing-eyes.workers.dev` before departure

---

## DESIGN SYSTEM — COCO v3

The design system is the signature of this protocol. It must be preserved and emphasized on every output.

**Key visual signatures:**
- **Animated color spectrum shimmer bars** — 7-color gradient (`#ff0080 → #ff6b35 → #ffd700 → #00e676 → #00b0ff → #8b00ff → #ff0080`) animating via CSS `shimmer` keyframes at 3s linear infinite + `spectrumPulse` opacity breath at 6s
- **Floating watercolor blobs** — 6 radial gradients (pink, blue, purple, gold, teal, red) with gentle `floatBlob` animation at 20s
- **Frosted glass cards** — `backdrop-filter: blur(8px)` with semi-transparent white backgrounds
- **Dark mode play windows** — `#0f0f18` background with muted text
- **Gold BEST LUCK treatment** — `#c8a45a` border, warm glow shadow, peak badge
- **Purple-pink gradient labels** — `linear-gradient(90deg, #a855f7, #ec4899)` with background-clip text
- **Rainbow divider** — 6-color gradient bar between header and content
- **Strategy bars** — Color-coded left-border bars (purple, blue, gold, amber, green, red)

Read `design/design-tokens.md` for the complete token reference.

---

## SYSTEM RULES

- Primary data source: live web search per target date. No cached or assumed data.
- Never guarantee outcomes. Frame as timing + probability only.
- Tone: Calm, disciplined. Kuya creative energy; zero-emotion on strategy.
- One BEST LUCK WINDOW per output. Never two.
- Break windows = protection protocol. Never frame as optional.
- Hard Rules footer: always included. Never omitted.
- File naming: `CasinoBusProtocol_Coco_MMDDYY.html`
- **Design integrity: animated spectrum + frosted glass must appear on every output.**

---

## CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 02/19/26 | Initial build — GG33 protocol, HTML + PNG outputs |
| 1.1 | 02/20/26 | LVxART design system, pre-expanded windows, download/share buttons, shimmer bars |
| 1.2 | 02/20/26 | Title → CASINO BUS PROTOCOL / by COCO. CF Workers POST deploy. |
| 2.0 | 03/20/26 | Full modularization. New Coco design system (vivid gradient + frosted glass). Thu/Fri/Sat batch config. Cloudflare CI/CD + Vercel deployment layer. |
| 3.0 | 03/25/26 | Git-connected Workers Builds CI/CD. Automated weekly cron schedule (Thu/Fri/Sat 18:00 UTC). Worker code in repo with `fetch` + `scheduled` handlers. Enhanced animated spectrum (floatBlob + spectrumPulse). Full module files populated. Design tokens codified. |
