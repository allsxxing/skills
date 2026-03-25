/**
 * Mom's Casino Bus Protocol — Cloudflare Worker
 * ALL SEEING EYES · GG33 SYSTEM · @allsxxing
 *
 * Handles:
 *   fetch  → serves the current Casino Bus Protocol HTML card
 *   scheduled → fires on Thu/Fri/Sat cron to log + future KV refresh hooks
 */

// ─── CURRENT PROTOCOL HTML ──────────────────────────────────────
// This HTML block is replaced on each git push by the skill automation.
// The skill generates date-specific content, commits to main, and
// Workers Builds auto-deploys within ~60 seconds.

const PROTOCOL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Mom's Casino Bus Protocol</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ─── ANIMATED COLOR SPECTRUM ─────────────────────────────────── */
  @keyframes shimmer {
    0% { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }

  @keyframes spectrumPulse {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }

  @keyframes floatBlob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(12px, -8px) scale(1.05); }
    66% { transform: translate(-8px, 6px) scale(0.97); }
  }

  @keyframes toastIn {
    0% { opacity: 0; transform: translateX(-50%) translateY(-12px); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes toastOut {
    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  }

  /* ─── BASE ────────────────────────────────────────────────────── */
  body {
    background: #faf8f5;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    justify-content: center;
    padding: 0 0 100px 0;
  }

  .page-wrap {
    width: 100%;
    max-width: 430px;
    position: relative;
  }

  /* ─── WATERCOLOR BLOB LAYER (ANIMATED) ────────────────────────── */
  .blobs {
    position: fixed;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 430px;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    animation: floatBlob 20s ease-in-out infinite;
    background:
      radial-gradient(ellipse 280px 220px at 20% 8%, rgba(255,105,180,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 200px 180px at 85% 12%, rgba(100,180,255,0.20) 0%, transparent 65%),
      radial-gradient(ellipse 240px 200px at 70% 35%, rgba(180,100,255,0.14) 0%, transparent 65%),
      radial-gradient(ellipse 300px 250px at 10% 55%, rgba(255,200,50,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 220px 200px at 90% 65%, rgba(80,220,180,0.15) 0%, transparent 65%),
      radial-gradient(ellipse 260px 200px at 40% 85%, rgba(255,80,80,0.12) 0%, transparent 65%);
  }

  .content {
    position: relative;
    z-index: 1;
    background: #fff;
  }

  /* ─── SHIMMER BARS (ANIMATED COLOR SPECTRUM) ──────────────────── */
  .shimmer-bar-top {
    height: 4px;
    background: linear-gradient(90deg, #ff0080, #ff6b35, #ffd700, #00e676, #00b0ff, #8b00ff, #ff0080);
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite, spectrumPulse 6s ease-in-out infinite;
  }

  .shimmer-bar-bottom {
    height: 6px;
    background: linear-gradient(90deg, #ff0080, #ff6b35, #ffd700, #00e676, #00b0ff, #8b00ff, #ff0080);
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite, spectrumPulse 6s ease-in-out infinite;
  }

  /* ─── HEADER ──────────────────────────────────────────────────── */
  .header {
    padding: 20px 20px 0 20px;
  }

  .eyebrow {
    font-size: 10px;
    letter-spacing: 4px;
    color: #c8a45a;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 900;
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
    margin-bottom: 6px;
  }

  .date-sub {
    font-size: 13px;
    font-weight: 600;
    color: #6b6b7a;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .rainbow-divider {
    height: 3px;
    background: linear-gradient(90deg, #ff69b4, #a855f7, #3b82f6, #10b981, #f59e0b, #ef4444);
    border-radius: 2px;
    margin-bottom: 16px;
  }

  /* ─── COSMIC CARD (FROSTED GLASS) ─────────────────────────────── */
  .cosmic-card {
    margin: 0 16px 16px;
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1.5px solid rgba(168,85,247,0.25);
    border-radius: 16px;
    padding: 14px 16px;
  }

  .cosmic-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 700;
    background: linear-gradient(90deg, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
  }

  .cosmic-rows {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .cosmic-row {
    font-size: 12px;
    line-height: 1.9;
    color: #b0a898;
    padding-left: 10px;
  }

  .cosmic-row.transit-1 { border-left: 3px solid #a855f7; padding-left: 8px; margin-bottom: 2px; }
  .cosmic-row.transit-2 { border-left: 3px solid #ec4899; padding-left: 8px; margin-bottom: 2px; }
  .cosmic-row.transit-3 { border-left: 3px solid #3b82f6; padding-left: 8px; margin-bottom: 2px; }
  .cosmic-row.transit-4 { border-left: 3px solid #f59e0b; padding-left: 8px; margin-bottom: 2px; }

  .resistance-alert {
    margin-top: 10px;
    background: rgba(255,80,80,0.08);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 11px;
    color: #ef4444;
    line-height: 1.6;
  }

  .resistance-alert strong {
    display: block;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  /* ─── SECTION LABELS ──────────────────────────────────────────── */
  .section-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 700;
    background: linear-gradient(90deg, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 16px 10px;
  }

  /* ─── BUS TIMELINE ────────────────────────────────────────────── */
  .bus-timeline {
    margin: 0 16px 16px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(168,85,247,0.15);
    border-radius: 10px;
    padding: 12px 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
  }

  .bus-row {
    font-size: 11px;
    color: #8a8898;
    line-height: 1.5;
  }

  .bus-row span {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #3a3848;
  }

  /* ─── PLAY WINDOW CARDS (DARK MODE) ───────────────────────────── */
  .windows {
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .window-card {
    background: #0f0f18;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 14px;
  }

  .window-card.best-luck {
    background: linear-gradient(135deg, #1c1508, #120e04);
    border: 1px solid #c8a45a;
    box-shadow: 0 0 20px rgba(200,164,90,0.18);
  }

  .window-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .window-time {
    font-size: 10px;
    color: #606070;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .window-card.best-luck .window-time { color: #f0c060; }

  .window-title {
    font-size: 13px;
    font-weight: 700;
    color: #d4c8b4;
    margin-bottom: 4px;
  }

  .window-card.best-luck .window-title { color: #f0c060; }

  .peak-badge {
    background: #c8a45a;
    color: #0a0804;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 3px 7px;
    border-radius: 4px;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .window-tips {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .tip {
    font-size: 11px;
    color: #706870;
    line-height: 1.5;
    padding-left: 12px;
    position: relative;
  }

  .tip::before {
    content: '\\2014';
    position: absolute;
    left: 0;
    color: #404058;
  }

  .window-card.best-luck .tip { color: #a08840; }
  .window-card.best-luck .tip::before { color: #806830; }

  .tip.alert { color: #ef4444; font-weight: 600; }
  .tip.alert::before { color: #ef4444; }

  /* ─── STRATEGY BARS ───────────────────────────────────────────── */
  .strategy-bar {
    margin-top: 10px;
    padding: 7px 10px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    border-left: 3px solid;
  }

  .strategy-bar.purple { background: rgba(168,85,247,0.08); border-color: #a855f7; color: #9060d0; }
  .strategy-bar.blue   { background: rgba(59,130,246,0.08);  border-color: #3b82f6; color: #4070c0; }
  .strategy-bar.gold   { background: rgba(200,164,90,0.12);  border-color: #c8a45a; color: #a08040; }
  .strategy-bar.amber  { background: rgba(245,158,11,0.08);  border-color: #f59e0b; color: #b07010; }
  .strategy-bar.green  { background: rgba(16,185,129,0.08);  border-color: #10b981; color: #108060; }
  .strategy-bar.red    { background: rgba(239,68,68,0.08);   border-color: #ef4444; color: #c04040; }

  /* ─── BREAK CARD ──────────────────────────────────────────────── */
  .window-card.break-card {
    background: #0a0a14;
    border-color: rgba(255,255,255,0.04);
  }

  .window-card.break-card .window-time,
  .window-card.break-card .window-title { color: #505060; }
  .window-card.break-card .tip { color: #404050; }
  .window-card.break-card .tip::before { color: #303040; }

  /* ─── HARD RULES ──────────────────────────────────────────────── */
  .hard-rules {
    margin: 0 16px 16px;
    background: rgba(255,255,255,0.85);
    border: 1.5px solid rgba(239,68,68,0.25);
    border-radius: 8px;
    padding: 14px;
  }

  .rules-label {
    font-size: 10px;
    color: #c04040;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .rule-row {
    font-size: 12px;
    color: #c08080;
    line-height: 2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rule-checkbox {
    width: 13px;
    height: 13px;
    border: 1.5px solid rgba(192,64,64,0.4);
    border-radius: 3px;
    flex-shrink: 0;
  }

  .disclaimer {
    font-size: 10px;
    color: #b09090;
    margin-top: 10px;
    font-style: italic;
    text-align: center;
  }

  /* ─── FOOTER ──────────────────────────────────────────────────── */
  .footer {
    font-size: 10px;
    color: #2a2830;
    letter-spacing: 2px;
    text-align: center;
    padding: 12px 16px 16px;
    text-transform: uppercase;
  }

  /* ─── FLOATING ACTION BAR ─────────────────────────────────────── */
  .action-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(168,85,247,0.2);
    padding: 12px 16px 16px;
    display: flex;
    gap: 10px;
    z-index: 100;
  }

  .btn-download {
    flex: 1;
    padding: 13px 10px;
    border-radius: 12px;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(168,85,247,0.40);
    letter-spacing: 0.3px;
  }

  .btn-share {
    flex: 1;
    padding: 13px 10px;
    border-radius: 12px;
    background: linear-gradient(135deg, #1a1a2e, #2d2d50);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(0,0,0,0.22);
    letter-spacing: 0.3px;
  }

  /* ─── TOAST ───────────────────────────────────────────────────── */
  .toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: linear-gradient(135deg, #a855f7, #ec4899);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    padding: 10px 22px;
    border-radius: 50px;
    box-shadow: 0 4px 22px rgba(168,85,247,0.45);
    z-index: 200;
    white-space: nowrap;
    display: none;
  }

  .toast.show { display: block; animation: toastIn 0.25s ease forwards; }
  .toast.hide { animation: toastOut 0.25s ease forwards; }
</style>
</head>
<body>
<div class="blobs"></div>
<div class="toast" id="toast"></div>

<div class="page-wrap">
  <div class="content">
    <div class="shimmer-bar-top"></div>

    <div class="header">
      <div class="eyebrow">ALL SEEING EYES · GG33 SYSTEM</div>
      <div class="title">Mom's Casino<br>/ Bus Protocol</div>
      <div class="date-sub" id="protocol-date">LOADING...</div>
      <div class="rainbow-divider"></div>
    </div>

    <div id="protocol-body">
      <div style="text-align:center;padding:60px 20px;color:#b0a898;font-size:14px;">
        Protocol content is deployed weekly.<br>
        Check back on Thursday, Friday, or Saturday.
      </div>
    </div>

    <div class="footer">ALL SEEING EYES · @ALLSXXING · GG33 SYSTEM</div>
    <div class="shimmer-bar-bottom"></div>
  </div>
</div>

<div class="action-bar">
  <button class="btn-download" onclick="downloadFile()">Download File</button>
  <button class="btn-share" onclick="shareLink()">Open Share Link</button>
</div>

<script>
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show';
    setTimeout(() => {
      t.className = 'toast hide';
      setTimeout(() => { t.className = 'toast'; }, 300);
    }, 3000);
  }

  function downloadFile() {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const yy = String(d.getFullYear()).slice(-2);
    a.download = 'CasinoBusProtocol_Coco_' + mm + dd + yy + '.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded — send the file directly');
  }

  function shareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard');
    }).catch(() => {
      showToast('Share: ' + url);
    });
  }
</script>
</body>
</html>`;

// ─── HANDLERS ───────────────────────────────────────────────────

export default {
  /**
   * fetch — serves the current protocol HTML card.
   * Content is updated via git push → Workers Builds auto-deploy.
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check endpoint for monitoring
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        worker: 'casino',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serve protocol HTML
    return new Response(PROTOCOL_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        'X-Protocol-Version': '3.0.0',
        'X-Powered-By': 'ALL SEEING EYES · GG33',
      },
    });
  },

  /**
   * scheduled — fires on Thu/Fri/Sat via cron triggers.
   * Currently logs execution; future: KV refresh, analytics, notifications.
   */
  async scheduled(event, env, ctx) {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[now.getUTCDay()];

    console.log(`[Casino Protocol] Cron fired: ${event.cron} | ${day} ${now.toISOString()}`);

    // Future hooks:
    // - Write fresh protocol data to KV
    // - Send notification to Mom's device
    // - Log analytics to D1
  },
};
