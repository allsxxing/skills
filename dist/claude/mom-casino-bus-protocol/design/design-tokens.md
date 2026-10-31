# Design Tokens — Coco Design System v3
<!-- Module: design/design-tokens.md -->

Definitive token reference. The animated color spectrum and frosted glass are the signature — preserve on every output.

---

## Spectrum Colors (Animated Shimmer)

| Token | Hex | Usage |
|-------|-----|-------|
| `--spectrum-pink` | `#ff0080` | Shimmer bar anchor |
| `--spectrum-orange` | `#ff6b35` | Shimmer bar |
| `--spectrum-gold` | `#ffd700` | Shimmer bar |
| `--spectrum-green` | `#00e676` | Shimmer bar |
| `--spectrum-blue` | `#00b0ff` | Shimmer bar |
| `--spectrum-violet` | `#8b00ff` | Shimmer bar anchor |

**Full gradient:** `linear-gradient(90deg, #ff0080, #ff6b35, #ffd700, #00e676, #00b0ff, #8b00ff, #ff0080)`

---

## UI Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--purple` | `#a855f7` | Labels, borders, strategy bar |
| `--pink` | `#ec4899` | Labels gradient end, buttons |
| `--blue` | `#3b82f6` | Transit border, strategy bar |
| `--amber` | `#f59e0b` | Transit border, strategy bar |
| `--green` | `#10b981` | Strategy bar |
| `--red` | `#ef4444` | Alerts, hard rules, strategy bar |
| `--gold` | `#c8a45a` | Peak badge, best luck border, eyebrow |
| `--gold-glow` | `rgba(200,164,90,0.18)` | Best luck card shadow |

---

## Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-page` | `#faf8f5` | Page background |
| `--bg-content` | `#ffffff` | Content wrapper |
| `--bg-card-light` | `rgba(255,255,255,0.75)` | Frosted glass cards |
| `--bg-card-dark` | `#0f0f18` | Play window cards |
| `--bg-card-break` | `#0a0a14` | Break window card |
| `--bg-best-luck` | `linear-gradient(135deg, #1c1508, #120e04)` | Best luck window |
| `--bg-action-bar` | `rgba(255,255,255,0.96)` | Floating action bar |

---

## Typography

| Element | Font | Weight | Size | Spacing |
|---------|------|--------|------|---------|
| Title | Playfair Display | 900 | 28px | — |
| Eyebrow | DM Sans | 600 | 10px | 4px |
| Date | DM Sans | 600 | 13px | 2px |
| Section Label | DM Sans | 700 | 9px | 3px |
| Window Time | DM Sans | 500 | 10px | 2px |
| Window Title | DM Sans | 700 | 13px | — |
| Tip Text | DM Sans | 400 | 11px | — |
| Strategy Bar | DM Sans | 600 | 11px | — |
| Peak Badge | DM Sans | 700 | 9px | 1px |
| Button | DM Sans | 700 | 13px | 0.3px |
| Footer | DM Sans | 400 | 10px | 2px |

Google Fonts: `Playfair+Display:wght@700;900` + `DM+Sans:wght@300;400;500;600`

---

## Animations

### Shimmer (Color Spectrum)
```css
@keyframes shimmer {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}
```
Apply: `background-size: 200% 100%; animation: shimmer 3s linear infinite;`

### Spectrum Pulse (Breathing Glow)
```css
@keyframes spectrumPulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}
```
Combined with shimmer: `animation: shimmer 3s linear infinite, spectrumPulse 6s ease-in-out infinite;`

### Float Blob (Watercolor Background)
```css
@keyframes floatBlob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(12px, -8px) scale(1.05); }
  66% { transform: translate(-8px, 6px) scale(0.97); }
}
```
Apply to `.blobs`: `animation: floatBlob 20s ease-in-out infinite;`

---

## Watercolor Blob Background

6 radial gradients creating a soft watercolor wash:
```css
background:
  radial-gradient(ellipse 280px 220px at 20% 8%, rgba(255,105,180,0.18) 0%, transparent 70%),
  radial-gradient(ellipse 200px 180px at 85% 12%, rgba(100,180,255,0.20) 0%, transparent 65%),
  radial-gradient(ellipse 240px 200px at 70% 35%, rgba(180,100,255,0.14) 0%, transparent 65%),
  radial-gradient(ellipse 300px 250px at 10% 55%, rgba(255,200,50,0.12) 0%, transparent 65%),
  radial-gradient(ellipse 220px 200px at 90% 65%, rgba(80,220,180,0.15) 0%, transparent 65%),
  radial-gradient(ellipse 260px 200px at 40% 85%, rgba(255,80,80,0.12) 0%, transparent 65%);
```

With floating animation: `animation: floatBlob 20s ease-in-out infinite;`

---

## Spacing & Layout

| Token | Value |
|-------|-------|
| `--max-width` | `430px` |
| `--card-radius` | `16px` |
| `--window-radius` | `8px` |
| `--card-padding` | `14px 16px` |
| `--section-margin` | `0 16px 16px` |
| `--shimmer-top-h` | `4px` |
| `--shimmer-bottom-h` | `6px` |
| `--divider-h` | `3px` |
