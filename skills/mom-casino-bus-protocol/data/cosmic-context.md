# Cosmic Context — Live Data Layer
<!-- Module: data/cosmic-context.md -->

## Data Sources (Per-Run)

Every run fetches LIVE data via web search. Never use cached or assumed data.

### 1. Lunar Phase
**Query:** `lunar phase [month] [day] [year]`

Extract:
- Phase name (New, Waxing Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous, Last Quarter, Waning Crescent)
- Illumination percentage
- Moon sign (zodiac)
- Void-of-course windows (times when Moon makes no major aspects — avoid for decisions)

### 2. Astrological Transits
**Query:** `astrology transits [month] [day] [year] daily`

Extract:
- Key planetary aspects
- Void-of-course Moon windows
- Notable conjunctions, squares, trines, oppositions
- Mercury retrograde status (if active)
- Saturn, Jupiter, Neptune positions

### 3. Chinese Zodiac Resistance Check
**Auto-apply through 2026:**
- 2026 = Year of the Fire Horse
- Horse vs Monkey = Direct Clash (冲)
- Always flag: HIGH RESISTANCE ENVIRONMENT
- Tighten strategy, reduce risk, protect gains aggressively

---

## Cosmic Context Block Format

Include at top of every output:

```
🌙 LUNAR · [Phase] in [Sign] — [illumination]% illuminated
   [Void-of-course note if applicable]
🔢 DAY CODE · [reduced number] — [Archetype]
   [Casino tone guidance]
🌍 YEAR CODE · 1 — Leadership / New Era / Self-Initiation
⚡ KEY TRANSITS · [Top 2-3 relevant transits for that date]
   [Mercury Rx status if active]
🐒 RESISTANCE CHECK — FIRE HORSE YEAR
   [Horse vs Monkey clash status + specific guidance]
```

---

## Void-of-Course Moon Rules

When Moon is void-of-course during play windows:
- Flag with ⚠ alert in affected window
- Reduce bet size guidance
- Add "extra caution" tip
- Note when void clears (Moon enters new sign)
