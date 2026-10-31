---
name: promo-code-hunter
description: Live promo code and deal finder for any app or subscription. Auto-runs web search across Reddit, X/Twitter, LinkedIn, AI aggregators, AppSumo, Product Hunt, and official brand pages to surface ACTIVE, verified discount codes and offers. Use this skill whenever the user asks about promo codes, discount codes, deals, coupons, or ways to save on any app, SaaS tool, subscription, or software. Also trigger when user says things like "is there a deal for X", "how do I get X cheaper", "any codes for X", "save on X", or "lifetime deal for X". ALWAYS trigger immediately when the user's message starts with or contains /promo, /promos, or /offers. If no app is specified, ask before searching.
---

# Promo Code Hunter — Live Deal Finder

## Behavior

- Auto-run web search immediately upon trigger. Do not ask for confirmation.
- Trigger immediately when user message contains `/promo`, `/promos`, or `/offers` — treat these as shorthand invocations.
- If no app/subscription is specified in the user's request, ask: "Which app or subscription should I search for?"
- Today's date is always auto-inserted from system context.
- Log codes to Notion or file ONLY if the user explicitly says a code works or requests logging.

---

## Search Strategy

Run web searches across the following source types, in priority order:

1. **Reddit** — `site:reddit.com [AppName] promo code` + `site:reddit.com [AppName] discount`. Target r/[appname], r/frugal, r/deals, r/coupons. Filter to last 30–90 days. Weight threads with upvotes + comment confirmations.
2. **X/Twitter** — `[AppName] promo code` and `[AppName] discount` filtered to recent. Look for brand accounts or verified user posts.
3. **LinkedIn** — Partnership announcements, new user offers, team/startup plan discounts.
4. **Lenny's Newsletter / Substack / Beehiiv** — For SaaS/productivity tools. Search `[AppName] deal site:substack.com` etc.
5. **AI Tool Aggregators** — Futurepedia, There's An AI For That, AI deal threads.
6. **Brand/Partner Bundles** — Check if bundled with Notion, Linear, Vercel, GitHub, or tools user has mentioned.
7. **Educational / Nonprofit / Startup discounts** — Search `[AppName] .edu discount` or `[AppName] startup program`.
8. **Official Brand Pages** — Pricing page, blog, changelog for active promos or referral programs.
9. **AppSumo / Product Hunt** — LTD or launch discounts. `site:appsumo.com [AppName]` + `site:producthunt.com [AppName]`.
10. **Browser Extension Communities** — Honey, Capital One Shopping threads with verified saves.

### Exclusion List — NEVER pull from:
- simplycodes.com
- grabon.in
- couponbirds.com
- retailmenot.com (unless working code confirmed in comments)
- dealspotr.com
- promocodeland.com
- Any site with "99% success rate" badges or auto-rotating codes

---

## Validation Rules

For every offer found:
- Must have a source URL — no source = exclude it
- If status is uncertain, label `[UNVERIFIED — TEST AT CHECKOUT]`
- Prioritize community-confirmed > official brand > aggregator-listed
- Only include offers active as of today's date
- Do not fabricate or assume codes are working

---

## Output Format

Return results inline using this exact structure:

---

### ACTIVE OFFERS — [APP NAME] — [TODAY'S DATE]

**[Offer Title]**
- Code: `CODEXXX` or `no code needed`
- Discount: X% off / $X off / X months free
- Type: Trial / Recurring / Bundle / LTD / One-time
- Expires: [Date] or `Unknown — verify at checkout`
- Source: [URL]
- Verified: `Community confirmed` / `Official` / `[UNVERIFIED — TEST AT CHECKOUT]`
- Notes: New users only / plan-specific / region restrictions / etc.

---

*(Repeat block per offer found)*

---

### IF NO VERIFIED CODES FOUND

Return instead:
- Current base pricing tiers (monthly vs annual)
- Active free trial details (length + card required?)
- Best known entry point (annual savings %)
- Referral program details if available

---

## Code Logging (On-Demand Only)

Only log a code if the user explicitly confirms it works (e.g., "that code worked", "confirmed", "logging this"). When triggered:
- Ask where to log: Notion, markdown file, or inline summary
- Log format: App | Code | Discount | Date Confirmed | Source

