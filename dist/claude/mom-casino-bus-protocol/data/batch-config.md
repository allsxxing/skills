# Batch Config — Weekly Cadence
<!-- Module: data/batch-config.md -->

## Schedule Frequency

Mom's casino bus runs on a **Thu / Fri / Sat** weekly cadence.

### Single Date Mode (Default)
When user requests a specific date, generate one protocol for that date.

### Batch Mode
When user says "this week" or "weekly outlook", generate protocols for all upcoming bus nights in the current week.

---

## Bus Schedule (Fixed)

| Event | Time (CT) |
|-------|----------|
| Depart Home | 7:00 PM |
| Arrive Casino | ~8:00 PM |
| Leave Casino | 1:45 AM |
| Arrive Home | ~3:00 AM |

Bus schedule is non-negotiable unless user explicitly updates it.

---

## Automated Deployment Schedule

Cloudflare Worker cron triggers:

| Day | Cron Expression | UTC Time | CT Time |
|-----|----------------|----------|--------|
| Thursday | `0 18 * * 4` | 18:00 UTC | 12:00 PM CT |
| Friday | `0 18 * * 5` | 18:00 UTC | 12:00 PM CT |
| Saturday | `0 18 * * 6` | 18:00 UTC | 12:00 PM CT |

Pipeline: Skill generates → push to repo → Workers Builds auto-deploys → live before 7 PM departure.

---

## Chinese Zodiac Context (2026)

- Year: Fire Horse (丙午)
- GJ's sign: Water Monkey
- Horse vs Monkey = Direct Clash (冲)
- **Flag: HIGH RESISTANCE ENVIRONMENT** for Monkey energy
- Adjust tone: tighten strategy, reduce risk, protect gains aggressively
- Mom's personal profile: add when DOB is provided
