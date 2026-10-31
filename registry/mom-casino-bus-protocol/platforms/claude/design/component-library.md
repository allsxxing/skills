# Component Library — UI Components
<!-- Module: design/component-library.md -->

## Shimmer Bar
Animated color spectrum bar. Top (4px) and bottom (6px) of content.
```css
.shimmer-bar-top {
  height: 4px;
  background: linear-gradient(90deg, #ff0080, #ff6b35, #ffd700, #00e676, #00b0ff, #8b00ff, #ff0080);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite, spectrumPulse 6s ease-in-out infinite;
}
```

## Cosmic Card (Frosted Glass)
```css
.cosmic-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1.5px solid rgba(168,85,247,0.25);
  border-radius: 16px;
  padding: 14px 16px;
}
```

## Cosmic Row (Transit Line)
4 variants with colored left borders:
- `.transit-1` → purple `#a855f7`
- `.transit-2` → pink `#ec4899`
- `.transit-3` → blue `#3b82f6`
- `.transit-4` → amber `#f59e0b`

## Resistance Alert
```css
.resistance-alert {
  background: rgba(255,80,80,0.08);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  font-size: 11px; color: #ef4444;
}
```

## Section Label (Gradient Text)
```css
.section-label {
  font-size: 9px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
```

## Window Card (Standard Dark)
```css
.window-card { background: #0f0f18; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px; }
```

## Window Card (Best Luck — Gold)
```css
.window-card.best-luck {
  background: linear-gradient(135deg, #1c1508, #120e04);
  border: 1px solid #c8a45a;
  box-shadow: 0 0 20px rgba(200,164,90,0.18);
}
```

## Peak Badge
```css
.peak-badge { background: #c8a45a; color: #0a0804; font-size: 9px; font-weight: 700; padding: 3px 7px; border-radius: 4px; }
```

## Strategy Bars (6 colors)
```css
.strategy-bar.purple { background: rgba(168,85,247,0.08); border-color: #a855f7; color: #9060d0; }
.strategy-bar.blue   { background: rgba(59,130,246,0.08);  border-color: #3b82f6; color: #4070c0; }
.strategy-bar.gold   { background: rgba(200,164,90,0.12);  border-color: #c8a45a; color: #a08040; }
.strategy-bar.amber  { background: rgba(245,158,11,0.08);  border-color: #f59e0b; color: #b07010; }
.strategy-bar.green  { background: rgba(16,185,129,0.08);  border-color: #10b981; color: #108060; }
.strategy-bar.red    { background: rgba(239,68,68,0.08);   border-color: #ef4444; color: #c04040; }
```

## Action Bar (Floating)
```css
.action-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  background: rgba(255,255,255,0.96); backdrop-filter: blur(16px);
  border-top: 1px solid rgba(168,85,247,0.2);
}
```

## Buttons
- **Download:** `background: linear-gradient(135deg, #a855f7, #ec4899)` + purple glow shadow
- **Share:** `background: linear-gradient(135deg, #1a1a2e, #2d2d50)` + dark shadow
