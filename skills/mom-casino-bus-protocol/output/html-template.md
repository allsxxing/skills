# HTML Template — Output Assembly
<!-- Module: output/html-template.md -->

## Assembly Order

1. HTML skeleton from `design/layout-spec.md`
2. Google Fonts link (Playfair Display + DM Sans)
3. CSS from `design/design-tokens.md` (animations, colors, typography)
4. Component CSS from `design/component-library.md`
5. Data injection:
   - **Header:** Day of week, full date
   - **Cosmic Context:** Lunar phase, day code, year code, transits, resistance check
   - **Bus Timeline:** Fixed times from `data/batch-config.md`
   - **Play Windows:** 6 windows from `data/protocol-schema.md` with computed BEST LUCK
   - **Hard Rules:** Fixed content
   - **Footer:** ALL SEEING EYES · @ALLSXXING · GG33 SYSTEM
6. JavaScript: download, share, toast functionality
7. Full page wrap with blobs + action bar

## File Naming

`CasinoBusProtocol_Coco_MMDDYY.html`

## Design Integrity Checklist

Before outputting, verify:
- [ ] Animated shimmer bars (top 4px + bottom 6px) with spectrumPulse
- [ ] Watercolor blobs with floatBlob animation (20s)
- [ ] Frosted glass cosmic card with backdrop-filter blur
- [ ] Dark mode play window cards (#0f0f18)
- [ ] Gold BEST LUCK window (border + glow + peak badge)
- [ ] Color-coded strategy bars on all 6 windows
- [ ] Rainbow divider below header (6-color)
- [ ] Purple-pink gradient section labels
- [ ] Hard rules card with red border
- [ ] Floating action bar (download + share buttons)
- [ ] Toast notification system
- [ ] 430px max-width mobile-proportioned

## Deployment

1. Replace `PROTOCOL_HTML` in `workers/casino/src/worker.js`
2. Push to `allsxxing/skills` repo
3. Workers Builds auto-deploys (~60s)
4. Verify at `https://casino.all-seeing-eyes.workers.dev/`
