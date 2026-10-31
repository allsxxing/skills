# Layout Spec — Page Structure
<!-- Module: design/layout-spec.md -->

## Hierarchy

```
body
├── .blobs (fixed watercolor bg, animated floatBlob 20s)
├── .toast (fixed notification, z-index: 200)
└── .page-wrap (max-width: 430px, centered)
    └── .content (white bg, z-index: 1)
        ├── .shimmer-bar-top (4px, animated spectrum)
        ├── .header
        │   ├── .eyebrow (ALL SEEING EYES · GG33 SYSTEM)
        │   ├── .title (Mom's Casino / Bus Protocol)
        │   ├── .date-sub (Day · Full Date)
        │   └── .rainbow-divider (3px, 6-color)
        ├── .cosmic-label + .cosmic-card (frosted glass)
        │   ├── .cosmic-rows (4 transit rows, colored left borders)
        │   └── .resistance-alert (conditional)
        ├── .section-label + .bus-timeline (2-col grid)
        ├── .section-label + .windows (flex column, 10px gap)
        │   ├── .window-card (×6, dark bg)
        │   │   ├── .window-header (time + title + optional peak-badge)
        │   │   ├── .window-tips (tip items with — prefix)
        │   │   └── .strategy-bar (colored left border)
        │   └── .window-card.best-luck (gold border + glow)
        ├── .hard-rules (red border card)
        ├── .footer
        └── .shimmer-bar-bottom (6px, animated spectrum)
    └── .action-bar (fixed bottom, frosted glass, z-index: 100)
        ├── .btn-download (purple-pink gradient)
        └── .btn-share (dark gradient)
```

## Responsive Rules

- Max width: 430px (mobile-first, centered)
- All horizontal margins: 16px
- Action bar: fixed bottom, full width up to 430px
- Blobs: fixed, centered at 430px
- No horizontal scroll

## Z-Index Stack

| Layer | Z-Index |
|-------|---------|
| Blobs background | 0 |
| Content | 1 |
| Action bar | 100 |
| Toast notification | 200 |
