import { useEffect } from "react";

/* =========================================================================
   DESIGN TOKENS
   Palette: warm paper background, ink text, five muted goal-accent colors,
   a deep indigo "thesis" accent that dominates until the midterm.
   Type: Fraunces (display/editorial serif) + Inter (UI) + IBM Plex Mono (data/countdown)
   ========================================================================= */
export const TOKENS = `
  :root{
    --paper:#FAF9F6;
    --paper-raised:#FFFFFF;
    --ink:#1B1D1F;
    --ink-soft:#5B6066;
    --ink-faint:#9AA0A6;
    --line:#E7E4DD;
    --line-soft:#F0EEE8;
    --thesis:#3B4A7A;
    --thesis-soft:#EEF0F8;
    --internship:#54606B;
    --internship-soft:#EEF1F3;
    --french:#5F7A5A;
    --french-soft:#EEF3ED;
    --chinese:#A4573F;
    --chinese-soft:#F7EDE9;
    --urbanism:#A9803F;
    --urbanism-soft:#F7F1E6;
    --gold:#B08D3F;
    --ontrack:#4F7A5B;
    --atrisk:#B08D3F;
    --behind:#B0523F;
    --completed:#3B4A7A;
    --radius-sm:6px;
    --radius-md:10px;
    --radius-lg:16px;
    --shadow-sm: 0 1px 2px rgba(27,29,31,0.04), 0 1px 1px rgba(27,29,31,0.03);
    --shadow-md: 0 4px 16px rgba(27,29,31,0.06), 0 1px 2px rgba(27,29,31,0.04);
  }
  .pt-root{
    background:var(--paper);
    color:var(--ink);
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    min-height:100vh;
    display:flex;
    position:relative;
  }
  .pt-serif{ font-family:'Fraunces', Georgia, serif; }
  .pt-mono{ font-family:'IBM Plex Mono', ui-monospace, monospace; }

  /* ---- layout ---- */
  .pt-sidebar{
    width:220px; flex-shrink:0; background:var(--paper-raised);
    border-right:1px solid var(--line); padding:28px 16px; display:flex; flex-direction:column;
    position:sticky; top:0; height:100vh; overflow-y:auto;
  }
  .pt-main{ flex:1; min-width:0; padding:36px 44px 80px; max-width:1180px; }
  .pt-brand{ font-size:19px; font-weight:600; letter-spacing:-0.01em; margin:0 8px 30px; line-height:1.25;}
  .pt-brand span{ display:block; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.14em; color:var(--ink-faint); font-weight:500; margin-top:4px; text-transform:uppercase;}
  .pt-nav{ display:flex; flex-direction:column; gap:2px; }
  .pt-nav-item{
    display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:var(--radius-sm);
    color:var(--ink-soft); font-size:14px; font-weight:500; cursor:pointer; border:none; background:none;
    text-align:left; width:100%; transition:background .12s ease, color .12s ease;
  }
  .pt-nav-item:hover{ background:var(--line-soft); color:var(--ink); }
  .pt-nav-item.active{ background:var(--thesis-soft); color:var(--thesis); }
  .pt-nav-sub{ margin-left:26px; display:flex; flex-direction:column; gap:1px; margin-top:2px; margin-bottom:6px;}
  .pt-nav-sub-item{ padding:6px 10px; font-size:13px; color:var(--ink-faint); cursor:pointer; border-radius:var(--radius-sm); }
  .pt-nav-sub-item:hover{ color:var(--ink); background:var(--line-soft); }
  .pt-nav-sub-item.active{ color:var(--thesis); font-weight:600; }
  .pt-nav-divider{ height:1px; background:var(--line); margin:14px 6px; }

  /* ---- typography helpers ---- */
  .pt-eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-faint); font-weight:500; }
  .pt-h1{ font-family:'Fraunces',serif; font-size:32px; font-weight:500; letter-spacing:-0.01em; margin:4px 0 6px; }
  .pt-h2{ font-family:'Fraunces',serif; font-size:22px; font-weight:500; margin:0 0 4px; }
  .pt-sub{ color:var(--ink-soft); font-size:14px; line-height:1.5; margin:0; }

  /* ---- cards ---- */
  .pt-card{ background:var(--paper-raised); border:1px solid var(--line); border-radius:var(--radius-lg); padding:22px; box-shadow:var(--shadow-sm); }
  .pt-card-tight{ padding:16px 18px; }
  .pt-grid5{ display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
  .pt-grid4{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .pt-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .pt-grid3{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  @media(max-width:1000px){ .pt-grid5{ grid-template-columns:repeat(2,1fr);} .pt-grid4{ grid-template-columns:repeat(2,1fr);} .pt-grid2{grid-template-columns:1fr;} .pt-grid3{grid-template-columns:1fr;} }
  @media(max-width:560px){ .pt-grid4{ grid-template-columns:1fr;} }

  /* ---- hero countdown ---- */
  .pt-hero{
    background:linear-gradient(135deg, var(--thesis) 0%, #2E3A61 100%);
    border-radius:var(--radius-lg); padding:30px 32px; color:#F4F5FA; position:relative; overflow:hidden;
    box-shadow:var(--shadow-md);
  }
  .pt-hero::after{
    content:''; position:absolute; right:-60px; top:-60px; width:220px; height:220px; border-radius:50%;
    background:radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  }
  .pt-hero-count{ font-family:'IBM Plex Mono',monospace; font-size:56px; font-weight:600; line-height:1; letter-spacing:-0.02em; }
  .pt-hero-label{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.75; margin-top:4px;}
  .pt-hero-days{ font-size:15px; opacity:0.8; margin-top:2px; }

  /* ---- status pill ---- */
  .pt-pill{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:3px 9px; border-radius:100px; text-transform:uppercase; letter-spacing:0.04em; }
  .pt-pill-ontrack{ background:#EAF2EC; color:var(--ontrack); }
  .pt-pill-atrisk{ background:#F7F0E0; color:var(--atrisk); }
  .pt-pill-behind{ background:#F7E7E2; color:var(--behind); }
  .pt-pill-completed{ background:var(--thesis-soft); color:var(--thesis); }
  .pt-pill-neutral{ background:var(--line-soft); color:var(--ink-soft); }

  /* ---- progress bar ---- */
  .pt-bar-track{ height:6px; background:var(--line-soft); border-radius:100px; overflow:hidden; }
  .pt-bar-fill{ height:100%; border-radius:100px; transition:width .3s ease; }

  /* ---- goal card ---- */
  .pt-goalcard{ border-radius:var(--radius-md); padding:16px; background:var(--paper-raised); border:1px solid var(--line); cursor:pointer; transition:transform .12s ease, box-shadow .12s ease; }
  .pt-goalcard:hover{ box-shadow:var(--shadow-md); transform:translateY(-1px); }
  .pt-goalcard-icon{ width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }

  /* ---- buttons ---- */
  .pt-btn{ display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; padding:8px 14px; border-radius:var(--radius-sm); border:1px solid var(--line); background:var(--paper-raised); color:var(--ink); cursor:pointer; transition:all .12s ease; }
  .pt-btn:hover{ border-color:var(--ink-faint); }
  .pt-btn-primary{ background:var(--thesis); color:#fff; border-color:var(--thesis); }
  .pt-btn-primary:hover{ opacity:0.92; border-color:var(--thesis); }
  .pt-btn-ghost{ border:none; background:none; padding:6px 8px; }
  .pt-btn-sm{ padding:5px 10px; font-size:12px; }
  .pt-btn-danger{ color:var(--behind); }
  .pt-btn:disabled{ opacity:0.45; cursor:not-allowed; }
  .pt-btn:disabled:hover{ border-color:var(--line); opacity:0.45; }
  .pt-btn-primary:disabled:hover{ border-color:var(--thesis); opacity:0.45; }

  /* ---- touch target helper (icon-only controls) ---- */
  .pt-tap{ min-width:36px; min-height:36px; display:inline-flex; align-items:center; justify-content:center; }

  /* ---- inputs ---- */
  .pt-input, .pt-select, .pt-textarea{
    width:100%; font-family:inherit; font-size:13.5px; padding:8px 10px; border-radius:var(--radius-sm);
    border:1px solid var(--line); background:var(--paper); color:var(--ink); outline:none;
  }
  .pt-input:focus, .pt-select:focus, .pt-textarea:focus{ border-color:var(--thesis); box-shadow:0 0 0 3px var(--thesis-soft); }
  .pt-textarea{ resize:vertical; min-height:60px; }
  .pt-label{ font-size:11.5px; font-weight:600; color:var(--ink-soft); margin-bottom:4px; display:block; }
  .pt-field{ margin-bottom:12px; }

  /* ---- tabs ---- */
  .pt-tabs{ display:flex; gap:4px; border-bottom:1px solid var(--line); margin-bottom:22px; flex-wrap:wrap; }
  .pt-tab{ padding:9px 14px; font-size:13px; font-weight:600; color:var(--ink-faint); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
  .pt-tab:hover{ color:var(--ink); }
  .pt-tab.active{ color:var(--thesis); border-bottom-color:var(--thesis); }

  /* ---- table ---- */
  .pt-table-wrap{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .pt-table{ width:100%; border-collapse:collapse; font-size:13px; }
  .pt-table th{ text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-faint); font-weight:600; padding:8px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
  .pt-table td{ padding:9px 10px; border-bottom:1px solid var(--line-soft); vertical-align:top; }
  .pt-table tr:hover td{ background:var(--line-soft); }

  /* ---- form validation ---- */
  .pt-field-error{ color:var(--behind); font-size:12px; margin:-6px 0 12px; }

  /* ---- modal ---- */
  .pt-modal-backdrop{ position:fixed; inset:0; background:rgba(27,29,31,0.4); display:flex; align-items:flex-start; justify-content:center; z-index:100; overflow-y:auto; padding:40px 20px; }
  .pt-modal{ background:var(--paper-raised); border-radius:var(--radius-lg); padding:26px; width:100%; max-width:560px; box-shadow:var(--shadow-md); }

  /* ---- timeline (thesis roadmap) ---- */
  .pt-timeline{ display:flex; flex-direction:column; gap:0; }
  .pt-tl-row{ display:flex; gap:14px; }
  .pt-tl-rail{ display:flex; flex-direction:column; align-items:center; width:20px; }
  .pt-tl-dot{ width:12px; height:12px; border-radius:50%; border:2px solid var(--thesis); background:var(--paper-raised); flex-shrink:0; margin-top:5px; }
  .pt-tl-dot.done{ background:var(--thesis); }
  .pt-tl-line{ width:2px; flex:1; background:var(--line); margin:2px 0; }
  .pt-tl-content{ flex:1; padding-bottom:22px; }

  /* xp / action toast */
  .pt-xp-toast{
    position:fixed; bottom:26px; right:26px; background:var(--ink); color:#fff; padding:12px 18px; border-radius:var(--radius-md);
    font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px; box-shadow:var(--shadow-md); z-index:200;
    animation: pt-toast-in .25s ease; max-width:420px;
  }
  .pt-xp-toast span{ flex:1; }
  .pt-toast-undo{
    background:rgba(255,255,255,0.16); border:none; color:#fff; font-weight:700; font-size:12px;
    padding:5px 11px; border-radius:6px; cursor:pointer; flex-shrink:0; min-height:30px;
  }
  .pt-toast-undo:hover{ background:rgba(255,255,255,0.28); }
  @keyframes pt-toast-in{ from{ opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }

  .pt-empty{ text-align:center; padding:40px 20px; color:var(--ink-faint); font-size:13.5px; }
  .pt-chip{ display:inline-flex; align-items:center; font-size:11.5px; padding:2px 8px; border-radius:100px; background:var(--line-soft); color:var(--ink-soft); font-weight:600; }
  a.pt-link{ color:var(--thesis); text-decoration:none; font-weight:600; }
  a.pt-link:hover{ text-decoration:underline; }

  /* ---- auth screen ---- */
  .pt-auth-wrap{ min-height:100vh; width:100%; display:flex; align-items:center; justify-content:center; background:var(--paper); }
  .pt-auth-card{ width:100%; max-width:380px; padding:0 20px; }
  .pt-auth-toggle{ text-align:center; font-size:13px; color:var(--ink-soft); margin-top:16px; }
  .pt-spin{ animation: pt-spin-rot 1s linear infinite; }
  @keyframes pt-spin-rot{ to{ transform:rotate(360deg); } }

  /* ---- mobile (phone-width PWA use) ---- */
  @media (max-width:760px){
    .pt-root{ flex-direction:column; }
    .pt-sidebar{
      width:100%; height:auto; position:sticky; top:0; z-index:40;
      flex-direction:row; align-items:center; gap:2px;
      padding:8px 10px; overflow-x:auto; -webkit-overflow-scrolling:touch;
      border-right:none; border-bottom:1px solid var(--line);
    }
    .pt-brand{ display:none; }
    .pt-nav{ flex-direction:row; gap:2px; flex:0 0 auto; }
    .pt-nav-item{ flex-direction:column; gap:3px; padding:8px 9px; font-size:10px; white-space:nowrap; min-width:56px; min-height:44px; text-align:center; justify-content:center; }
    .pt-nav-sub{ flex-direction:row; margin-left:0; margin-top:0; margin-bottom:0; overflow-x:auto; gap:4px; padding-left:2px; }
    .pt-nav-sub-item{ white-space:nowrap; padding:8px 10px; min-height:40px; display:flex; align-items:center; }
    .pt-nav-divider{ display:none; }
    .pt-sidebar-note, .pt-sidebar-spacer{ display:none; }
    .pt-main{ padding:20px 16px 90px; max-width:100%; }

    .pt-xp-toast{ left:16px; right:16px; max-width:none; }

    .pt-modal-backdrop{ padding:16px 12px; }

    /* larger touch targets for icon-only / compact controls */
    .pt-btn-ghost{ min-width:38px; min-height:38px; }
    .pt-btn-sm{ min-height:36px; padding:7px 12px; }
  }

  /* ---- love note & distance banner ---- */
  .pt-love-card{
    background: linear-gradient(135deg, #FFF8F8 0%, #FFF2F4 100%);
    border: 1px solid #F5D3D9;
    border-radius: var(--radius-lg);
    padding: 22px 24px;
    box-shadow: 0 4px 20px rgba(224, 112, 133, 0.08);
    position: relative;
    overflow: hidden;
  }
  .pt-love-card::before{
    content: '❤️';
    position: absolute;
    right: -15px;
    bottom: -15px;
    font-size: 110px;
    opacity: 0.05;
    pointer-events: none;
  }
  .pt-dual-clock{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid #F0CCD3;
    padding: 6px 14px;
    border-radius: 100px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .pt-clock-dot{
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #E05670;
    animation: pt-pulse-dot 1.5s infinite;
  }
  @keyframes pt-pulse-dot{
    0%{ transform: scale(0.9); opacity: 0.6; }
    50%{ transform: scale(1.3); opacity: 1; }
    100%{ transform: scale(0.9); opacity: 0.6; }
  }
  .pt-hug-btn{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #E05670;
    color: #FFFFFF;
    font-weight: 600;
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(224, 86, 112, 0.25);
    transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .pt-hug-btn:hover{
    background: #D04560;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(224, 86, 112, 0.35);
  }
  .pt-hug-btn:active{
    transform: scale(0.97);
  }
  .pt-floating-heart{
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    font-size: 24px;
    animation: pt-float-up 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  @keyframes pt-float-up{
    0%{ opacity: 1; transform: translateY(0) scale(0.6) rotate(0deg); }
    50%{ opacity: 0.9; transform: translateY(-70px) scale(1.2) rotate(15deg); }
    100%{ opacity: 0; transform: translateY(-160px) scale(1.6) rotate(-20deg); }
  }
`;

/* =========================================================================
   FONT LOADING
   ========================================================================= */
export function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch (e) {} };
  }, []);
  return null;
}
