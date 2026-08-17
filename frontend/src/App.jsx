/* ═══════════════════════════════════════════════════════════════════════════
   StegoShield — Complete Professional UI
   Aesthetic: Dark-mode cybersecurity terminal meets liquid glass morphism.
   Fonts: Syne (display) + JetBrains Mono (data/code) + Inter (body)
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';

/* ─── Inject global CSS ─────────────────────────────────────────────────── */
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --bg:         #080c14;
        --bg2:        #0d1117;
        --surface:    rgba(255,255,255,0.04);
        --surface2:   rgba(255,255,255,0.07);
        --glass:      rgba(255,255,255,0.06);
        --border:     rgba(255,255,255,0.08);
        --border2:    rgba(255,255,255,0.14);
        --text:       #e8edf5;
        --text2:      #8b96a8;
        --text3:      #5a6478;

        --blue:       #3b82f6;
        --blue-glow:  rgba(59,130,246,0.35);
        --blue-dim:   rgba(59,130,246,0.12);
        --teal:       #14b8a6;
        --teal-glow:  rgba(20,184,166,0.35);
        --purple:     #a78bfa;
        --purple-glow:rgba(167,139,250,0.35);
        --orange:     #fb923c;
        --orange-glow:rgba(251,146,60,0.35);
        --green:      #34d399;
        --green-glow: rgba(52,211,153,0.35);
        --red:        #f87171;
        --red-glow:   rgba(248,113,113,0.35);
        --yellow:     #fbbf24;

        --r-sm:  10px;
        --r-md:  16px;
        --r-lg:  24px;
        --r-xl:  32px;
      }

      html { scroll-behavior: smooth; }

      body {
        background: var(--bg);
        color: var(--text);
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        line-height: 1.6;
        min-height: 100vh;
        overflow-x: hidden;
      }

      /* Animated grid background */
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
        z-index: 0;
      }

      /* Ambient glow orbs */
      body::after {
        content: '';
        position: fixed;
        top: -20%;
        left: -10%;
        width: 60%;
        height: 60%;
        background: radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        animation: orb-drift 12s ease-in-out infinite alternate;
      }

      @keyframes orb-drift {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(5%, 8%) scale(1.1); }
      }

      #root { position: relative; z-index: 1; }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: var(--bg2); }
      ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

      /* ── Navbar ─────────────────────────────────────────────────── */
      .navbar {
        position: sticky; top: 0; z-index: 100;
        background: rgba(8,12,20,0.85);
        backdrop-filter: blur(20px) saturate(180%);
        border-bottom: 1px solid var(--border);
        padding: 0 2rem;
        height: 64px;
        display: flex; align-items: center; justify-content: space-between;
      }
      .nav-logo {
        font-family: 'Syne', sans-serif;
        font-weight: 800;
        font-size: 1.4rem;
        letter-spacing: -0.02em;
        display: flex; align-items: center; gap: 10px;
      }
      .nav-logo .shield { font-size: 1.1rem; }
      .nav-logo .brand { background: linear-gradient(135deg, #3b82f6, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .nav-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem; font-weight: 600;
        background: var(--blue-dim);
        color: var(--blue);
        border: 1px solid rgba(59,130,246,0.3);
        padding: 2px 8px; border-radius: 100px;
      }
      .nav-links { display: flex; gap: 4px; }
      .nav-link {
        display: flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: var(--r-sm);
        font-size: 0.85rem; font-weight: 500;
        color: var(--text2); text-decoration: none;
        border: 1px solid transparent;
        transition: all 0.2s ease;
        position: relative; overflow: hidden;
      }
      .nav-link:hover {
        color: var(--text);
        background: var(--surface2);
        border-color: var(--border2);
      }
      .nav-link.active {
        color: var(--text);
        background: var(--surface2);
        border-color: var(--border2);
      }
      .nav-link.active::after {
        content: '';
        position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
        width: 60%; height: 2px;
        border-radius: 2px 2px 0 0;
      }
      .nav-link.enc.active::after { background: var(--blue); }
      .nav-link.dec.active::after { background: var(--teal); }
      .nav-link.det.active::after { background: var(--purple); }
      .nav-link.atk.active::after { background: var(--orange); }

      /* Dark mode toggle */
      .theme-toggle {
        width: 34px; height: 34px; border-radius: 50%;
        background: var(--surface2); border: 1px solid var(--border2);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: 0.9rem;
        transition: all 0.2s;
        color: var(--text2);
      }
      .theme-toggle:hover { background: var(--glass); color: var(--text); }

      /* Light mode overrides */
      body.light {
        --bg:       #f0f4ff;
        --bg2:      #e8eef8;
        --surface:  rgba(0,0,0,0.03);
        --surface2: rgba(0,0,0,0.06);
        --glass:    rgba(255,255,255,0.8);
        --border:   rgba(0,0,0,0.08);
        --border2:  rgba(0,0,0,0.14);
        --text:     #111827;
        --text2:    #4b5563;
        --text3:    #9ca3af;
      }
      body.light::before {
        background-image:
          linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
      }

      /* ── Page wrapper ───────────────────────────────────────────── */
      .page { max-width: 760px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

      /* ── Page header ────────────────────────────────────────────── */
      .page-header { margin-bottom: 2rem; }
      .page-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; font-weight: 600;
        color: var(--text3);
        letter-spacing: 0.12em; text-transform: uppercase;
        margin-bottom: 0.5rem;
        display: flex; align-items: center; gap: 8px;
      }
      .page-eyebrow::before {
        content: ''; display: block;
        width: 20px; height: 1px;
        background: var(--text3);
      }
      .page-title {
        font-family: 'Syne', sans-serif;
        font-size: 2.2rem; font-weight: 800;
        line-height: 1.15; letter-spacing: -0.03em;
      }
      .page-title.blue    { background: linear-gradient(135deg, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .page-title.teal    { background: linear-gradient(135deg, #5eead4, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .page-title.purple  { background: linear-gradient(135deg, #c4b5fd, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .page-title.orange  { background: linear-gradient(135deg, #fdba74, #fb923c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .page-subtitle { color: var(--text2); font-size: 0.9rem; margin-top: 0.5rem; }

      /* ── Glass card ─────────────────────────────────────────────── */
      .card {
        background: var(--glass);
        backdrop-filter: blur(16px);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        overflow: hidden;
        margin-bottom: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .card:hover { border-color: var(--border2); }
      .card-header {
        padding: 0.85rem 1.25rem;
        border-bottom: 1px solid var(--border);
        display: flex; align-items: center; gap: 10px;
        background: var(--surface);
      }
      .card-header-dot {
        width: 8px; height: 8px; border-radius: 50%;
        flex-shrink: 0;
      }
      .card-header-title {
        font-size: 0.8rem; font-weight: 600;
        color: var(--text2); letter-spacing: 0.04em;
        text-transform: uppercase;
        font-family: 'JetBrains Mono', monospace;
      }
      .card-header-step {
        margin-left: auto;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem; color: var(--text3);
      }
      .card-body { padding: 1.25rem; }

      /* accent colors for card dots */
      .dot-blue   { background: var(--blue); box-shadow: 0 0 8px var(--blue-glow); }
      .dot-teal   { background: var(--teal); box-shadow: 0 0 8px var(--teal-glow); }
      .dot-purple { background: var(--purple); box-shadow: 0 0 8px var(--purple-glow); }
      .dot-orange { background: var(--orange); box-shadow: 0 0 8px var(--orange-glow); }
      .dot-green  { background: var(--green); box-shadow: 0 0 8px var(--green-glow); }
      .dot-red    { background: var(--red); box-shadow: 0 0 8px var(--red-glow); }

      /* ── Drop zone ──────────────────────────────────────────────── */
      .dropzone {
        border: 1.5px dashed var(--border2);
        border-radius: var(--r-md);
        padding: 2.5rem 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.25s ease;
        background: var(--surface);
        position: relative;
      }
      .dropzone:hover, .dropzone.active {
        border-color: var(--blue);
        background: var(--blue-dim);
        box-shadow: 0 0 0 4px rgba(59,130,246,0.08), inset 0 0 30px rgba(59,130,246,0.05);
      }
      .dropzone-icon { font-size: 2.2rem; margin-bottom: 0.75rem; display: block; }
      .dropzone-primary { font-weight: 600; color: var(--text); font-size: 0.9rem; }
      .dropzone-secondary { color: var(--text3); font-size: 0.78rem; margin-top: 0.3rem; }
      .dropzone-preview { max-height: 160px; border-radius: var(--r-sm); object-fit: contain; margin-bottom: 0.75rem; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
      .dropzone-filename { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--text2); margin-bottom: 0.3rem; }
      .dropzone-replace { font-size: 0.72rem; color: var(--blue); }

      /* ── Form elements ──────────────────────────────────────────── */
      label {
        display: block;
        font-size: 0.78rem; font-weight: 600;
        color: var(--text2); letter-spacing: 0.04em; text-transform: uppercase;
        margin-bottom: 0.5rem;
        font-family: 'JetBrains Mono', monospace;
      }
      textarea, input[type="text"], input[type="password"] {
        width: 100%;
        background: var(--surface);
        border: 1px solid var(--border2);
        border-radius: var(--r-sm);
        padding: 0.75rem 1rem;
        color: var(--text);
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        resize: vertical;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      textarea:focus, input:focus {
        border-color: var(--blue);
        box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
      }
      textarea::placeholder, input::placeholder { color: var(--text3); }

      .input-meta {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem; color: var(--text3);
        margin-top: 0.4rem; display: flex; justify-content: space-between;
      }

      /* Range slider */
      .slider-wrap { margin-top: 0.25rem; }
      input[type="range"] {
        -webkit-appearance: none; width: 100%; height: 4px;
        background: var(--border2); border-radius: 4px; outline: none;
        cursor: pointer; margin: 0.5rem 0;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
        background: var(--blue);
        box-shadow: 0 0 0 3px rgba(59,130,246,0.25);
        cursor: pointer; transition: box-shadow 0.2s;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        box-shadow: 0 0 0 6px rgba(59,130,246,0.2);
      }
      .slider-labels { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text3); }
      .slider-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1rem; font-weight: 600; color: var(--blue);
        margin-bottom: 0.25rem;
      }

      /* Attack type buttons */
      .attack-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .attack-btn {
        padding: 0.6rem 0.75rem; border-radius: var(--r-sm);
        border: 1px solid var(--border2);
        background: var(--surface);
        color: var(--text2); font-size: 0.82rem; font-weight: 500;
        cursor: pointer; transition: all 0.2s;
        display: flex; align-items: center; gap: 6px;
      }
      .attack-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--border2); }
      .attack-btn.selected {
        background: rgba(251,146,60,0.12);
        border-color: var(--orange);
        color: var(--orange);
      }

      /* ── Primary button ─────────────────────────────────────────── */
      .btn {
        width: 100%; padding: 0.9rem 1.5rem;
        border: none; border-radius: var(--r-md);
        font-family: 'Syne', sans-serif;
        font-size: 0.95rem; font-weight: 700;
        letter-spacing: 0.02em;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative; overflow: hidden;
        margin: 0.5rem 0;
      }
      .btn::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
        pointer-events: none;
      }
      .btn:hover:not(:disabled) { transform: translateY(-2px); }
      .btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
      .btn:disabled { opacity: 0.4; cursor: not-allowed; }

      .btn-blue   { background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; box-shadow: 0 4px 20px rgba(59,130,246,0.4); }
      .btn-teal   { background: linear-gradient(135deg, #14b8a6, #06b6d4); color: #fff; box-shadow: 0 4px 20px rgba(20,184,166,0.4); }
      .btn-purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); color: #fff; box-shadow: 0 4px 20px rgba(139,92,246,0.4); }
      .btn-orange { background: linear-gradient(135deg, #f97316, #fb923c); color: #fff; box-shadow: 0 4px 20px rgba(249,115,22,0.4); }
      .btn-ghost  { background: var(--surface2); border: 1px solid var(--border2); color: var(--text2); box-shadow: none; }
      .btn-ghost:hover:not(:disabled) { color: var(--text); border-color: var(--border2); }

      /* ── Error / Warning alerts ─────────────────────────────────── */
      .alert {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 1rem 1.25rem; border-radius: var(--r-md);
        border: 1px solid; margin: 0.5rem 0;
        animation: slide-in 0.25s ease;
      }
      .alert-error   { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.25); }
      .alert-warning { background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.25); }
      .alert-info    { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.25); }
      .alert-icon  { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
      .alert-title { font-weight: 600; font-size: 0.85rem; margin-bottom: 2px; }
      .alert-error .alert-title   { color: var(--red); }
      .alert-warning .alert-title { color: var(--yellow); }
      .alert-info .alert-title    { color: var(--blue); }
      .alert-body  { font-size: 0.82rem; color: var(--text2); }

      @keyframes slide-in {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ── Result section ─────────────────────────────────────────── */
      .result-card {
        background: var(--glass);
        backdrop-filter: blur(16px);
        border: 1px solid var(--border2);
        border-radius: var(--r-lg);
        overflow: hidden;
        animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        margin-top: 0.5rem;
      }
      @keyframes pop-in {
        from { opacity: 0; transform: scale(0.96) translateY(12px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      .result-header {
        padding: 1rem 1.25rem;
        display: flex; align-items: center; gap: 10px;
        border-bottom: 1px solid var(--border);
      }
      .result-status-dot { width: 10px; height: 10px; border-radius: 50%; animation: pulse-glow 2s ease-in-out infinite; }
      .status-success { background: var(--green); box-shadow: 0 0 0 3px var(--green-glow); }
      .status-danger  { background: var(--red);   box-shadow: 0 0 0 3px var(--red-glow);   }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 0 3px var(--green-glow); }
        50%       { box-shadow: 0 0 0 6px transparent; }
      }
      .result-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; }
      .result-body { padding: 1.25rem; }

      /* Stego image */
      .stego-preview {
        width: 100%; max-height: 220px; object-fit: contain;
        border-radius: var(--r-sm); margin-bottom: 1rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      }

      /* Metrics grid */
      .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 1rem 0; }
      .metric {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        padding: 0.75rem;
        text-align: center;
      }
      .metric-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.3rem; }
      .metric-value { font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 600; color: var(--text); }
      .metric-sub   { font-size: 0.65rem; color: var(--text3); margin-top: 0.15rem; }

      /* Download button */
      .btn-download {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; padding: 0.75rem;
        background: linear-gradient(135deg, rgba(52,211,153,0.15), rgba(20,184,166,0.15));
        border: 1px solid rgba(52,211,153,0.3);
        border-radius: var(--r-sm);
        color: var(--green); font-weight: 600; font-size: 0.9rem;
        text-decoration: none; transition: all 0.2s;
        cursor: pointer;
      }
      .btn-download:hover { background: rgba(52,211,153,0.2); transform: translateY(-1px); }

      /* Message display */
      .message-box {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        padding: 1rem 1.25rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem; color: var(--text);
        min-height: 80px; white-space: pre-wrap;
        word-break: break-word;
      }
      .message-meta {
        display: flex; justify-content: space-between;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.68rem; color: var(--text3);
        margin-top: 0.5rem;
      }
      .btn-copy {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        width: 100%; padding: 0.65rem;
        background: var(--surface2); border: 1px solid var(--border2);
        border-radius: var(--r-sm); color: var(--text2);
        font-size: 0.82rem; font-weight: 500;
        cursor: pointer; transition: all 0.2s; margin-top: 0.75rem;
      }
      .btn-copy:hover { color: var(--text); background: var(--glass); }
      .btn-copy.copied { color: var(--green); border-color: rgba(52,211,153,0.3); }

      /* Confidence bar */
      .confidence-wrap { margin: 1rem 0; }
      .confidence-label { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--text2); margin-bottom: 0.5rem; }
      .confidence-track { height: 8px; background: var(--surface); border-radius: 100px; overflow: hidden; }
      .confidence-fill  { height: 100%; border-radius: 100px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .fill-green  { background: linear-gradient(90deg, var(--green), #86efac); }
      .fill-red    { background: linear-gradient(90deg, var(--red),   #fca5a5); }
      .fill-blue   { background: linear-gradient(90deg, var(--blue),  #93c5fd); }
      .fill-yellow { background: linear-gradient(90deg, var(--yellow), #fde68a); }
      .fill-orange { background: linear-gradient(90deg, var(--orange), #fdba74); }

      /* Prediction banner */
      .prediction-banner {
        padding: 2rem; border-radius: var(--r-md); text-align: center; margin-bottom: 1rem;
        animation: pop-in 0.3s ease;
      }
      .prediction-banner.stego {
        background: rgba(248,113,113,0.08);
        border: 1px solid rgba(248,113,113,0.2);
      }
      .prediction-banner.clean {
        background: rgba(52,211,153,0.08);
        border: 1px solid rgba(52,211,153,0.2);
      }
      .prediction-icon { font-size: 3rem; margin-bottom: 0.75rem; display: block; }
      .prediction-label {
        font-family: 'Syne', sans-serif;
        font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em;
      }
      .prediction-label.stego { color: var(--red); }
      .prediction-label.clean { color: var(--green); }
      .prediction-sub { font-size: 0.82rem; color: var(--text2); margin-top: 0.3rem; }

      .prob-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 1rem; }
      .prob-card {
        padding: 0.75rem; border-radius: var(--r-sm); text-align: center;
        background: var(--surface); border: 1px solid var(--border);
      }
      .prob-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; }
      .prob-value { font-family: 'JetBrains Mono', monospace; font-size: 1.3rem; font-weight: 700; margin-top: 0.3rem; }
      .prob-clean { color: var(--green); }
      .prob-stego { color: var(--red); }

      /* Inference detail row */
      .inference-row {
        display: flex; flex-wrap: wrap; gap: 16px;
        padding: 0.75rem 1rem;
        background: var(--surface); border-radius: var(--r-sm);
        border: 1px solid var(--border);
        font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text3);
      }
      .inference-row span b { color: var(--text2); }

      /* Attack results */
      .ber-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1rem; }
      .ber-item {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--r-sm); padding: 0.75rem;
      }
      .ber-label  { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.3rem; }
      .ber-value  { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; color: var(--text); }
      .ber-sub    { font-size: 0.65rem; color: var(--text3); margin-top: 0.1rem; }

      .preview-box {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--r-sm); padding: 0.75rem 1rem;
        font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
        color: var(--text2); word-break: break-all;
      }
      .preview-label { font-size: 0.65rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem; }

      /* Pending state */
      .pending-badge {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25);
        color: var(--yellow); padding: 0.5rem 1rem; border-radius: 100px;
        font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 600;
        margin-bottom: 1rem;
      }
      .pending-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--yellow); animation: blink 1.4s ease-in-out infinite; }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

      /* Spinner */
      .spinner {
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.25);
        border-top-color: #fff;
        animation: spin 0.6s linear infinite; display: inline-block;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Divider */
      .divider { height: 1px; background: var(--border); margin: 1rem 0; }

      /* Footer */
      footer {
        border-top: 1px solid var(--border);
        padding: 1.25rem 2rem;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.68rem; color: var(--text3);
      }

      /* Entrance animation for page */
      .page-enter { animation: page-in 0.35s ease; }
      @keyframes page-in {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Warning note */
      .note {
        display: flex; gap: 8px; align-items: flex-start;
        font-size: 0.78rem; color: var(--text3);
        background: var(--surface); border-radius: var(--r-sm);
        border: 1px solid var(--border); padding: 0.65rem 0.85rem;
        margin-top: 0.5rem;
      }
      .note-icon { flex-shrink: 0; margin-top: 1px; }

      /* Responsive */
      @media (max-width: 640px) {
        .navbar { padding: 0 1rem; }
        .nav-links { gap: 2px; }
        .nav-link  { padding: 6px 10px; font-size: 0.8rem; }
        .nav-link span.label { display: none; }
        .page      { padding: 1.5rem 1rem 3rem; }
        .page-title { font-size: 1.7rem; }
        .metrics-grid { grid-template-columns: 1fr 1fr; }
        .ber-grid  { grid-template-columns: 1fr; }
        .attack-grid { grid-template-columns: 1fr 1fr; }
        .prob-grid  { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

/* ─── API Service ───────────────────────────────────────────────────────── */
const API = 'http://localhost:8000/api/v1';
const apiCall = async (endpoint, formData, responseType = 'json') => {
  const res = await fetch(`${API}${endpoint}`, { method: 'POST', body: formData });
  if (responseType === 'blob') {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail?.message || err?.detail || 'Request failed');
    }
    const blob = await res.blob();
    return { blob, headers: res.headers };
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail?.message || data?.detail || data?.message || 'Request failed');
  return data;
};

/* ─── Shared: ImageUploader ─────────────────────────────────────────────── */
function ImageUploader({ onFile, label = 'image', accentColor = 'blue' }) {
  const [preview, setPreview] = useState(null);
  const [name, setName]       = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handle = (file) => {
    if (!file) return;
    setName(file.name);
    setPreview(URL.createObjectURL(file));
    onFile(file);
  };
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handle(e.dataTransfer.files[0]);
  };
  return (
    <div
      className={`dropzone${dragging ? ' active' : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => handle(e.target.files[0])} />
      {preview ? (
        <>
          <img src={preview} alt="preview" className="dropzone-preview" />
          <div className="dropzone-filename">{name}</div>
          <div className="dropzone-replace">Click or drag to replace</div>
        </>
      ) : (
        <>
          <span className="dropzone-icon">📸</span>
          <div className="dropzone-primary">Drop {label} here, or click to browse</div>
          <div className="dropzone-secondary">PNG · JPEG · BMP supported</div>
        </>
      )}
    </div>
  );
}

/* ─── Shared: ConfidenceBar ─────────────────────────────────────────────── */
function ConfidenceBar({ value, colorClass = 'fill-blue', label }) {
  return (
    <div className="confidence-wrap">
      <div className="confidence-label">
        <span>{label}</span>
        <span>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="confidence-track">
        <div className={`confidence-fill ${colorClass}`} style={{ width: `${Math.min(100, value*100)}%` }} />
      </div>
    </div>
  );
}

/* ─── Shared: MetricCard ────────────────────────────────────────────────── */
function Metric({ label, value, sub }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

/* ─── Shared: Card ──────────────────────────────────────────────────────── */
function Card({ title, dotClass = 'dot-blue', step, children }) {
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <div className={`card-header-dot ${dotClass}`} />
          <div className="card-header-title">{title}</div>
          {step && <div className="card-header-step">{step}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

/* ─── Shared: Alert ─────────────────────────────────────────────────────── */
function Alert({ type = 'error', message }) {
  if (!message) return null;
  const icons = { error: '⚠', warning: '⚡', info: 'ℹ' };
  const titles = { error: 'Error', warning: 'Warning', info: 'Info' };
  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{icons[type]}</span>
      <div>
        <div className="alert-title">{titles[type]}</div>
        <div className="alert-body">{message}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ENCODE PAGE
   ═══════════════════════════════════════════════════════════════════════ */
function EncodePage() {
  const [image,   setImage]   = useState(null);
  const [message, setMessage] = useState('');
  const [key,     setKey]     = useState('');
  const [payload, setPayload] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const run = async () => {
    if (!image || !message) return setError('Please upload an image and enter a message.');
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', image); fd.append('message', message);
      fd.append('payload', payload); if (key) fd.append('key', key);
      const { blob, headers } = await apiCall('/encode', fd, 'blob');
      const url = URL.createObjectURL(blob);
      setResult({
        url,
        psnr : headers.get('x-psnr') || '—',
        ms   : headers.get('x-encoding-time-ms') || '—',
        cap  : headers.get('x-capacity-bytes') || '—',
      });
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div className="page-eyebrow">AES-256 + JUNIWARD</div>
        <h1 className="page-title blue">Hide Secret Message</h1>
        <p className="page-subtitle">Encrypt with AES-256-CBC, then embed invisibly via JUNIWARD adaptive steganography.</p>
      </div>

      <Card title="Cover Image" dotClass="dot-blue" step="01 / 03">
        <ImageUploader onFile={setImage} label="cover image" />
      </Card>

      <Card title="Secret Message" dotClass="dot-blue" step="02 / 03">
        <textarea rows={4} placeholder="Type your secret message…" value={message}
          onChange={e => setMessage(e.target.value)} />
        <div className="input-meta">
          <span>{new Blob([message]).size} bytes</span>
          <span>{message.length} chars</span>
        </div>
      </Card>

      <Card title="Settings" dotClass="dot-blue" step="03 / 03">
        <div style={{ marginBottom:'1rem' }}>
          <label>Encryption Key (optional)</label>
          <input type="text" placeholder="Leave empty — system key will be used" value={key} onChange={e => setKey(e.target.value)} />
          <div className="note" style={{marginTop:'0.5rem'}}>
            <span className="note-icon">🔑</span>
            <span>If you provide a custom key, keep it safe — you'll need it to decode.</span>
          </div>
        </div>
        <div>
          <label>Payload Rate</label>
          <div className="slider-value">{payload} bpp</div>
          <input type="range" min={0.1} max={0.4} step={0.05} value={payload}
            onChange={e => setPayload(parseFloat(e.target.value))} />
          <div className="slider-labels"><span>0.1 · Stealthier</span><span>0.4 · More capacity</span></div>
        </div>
      </Card>

      <button className="btn btn-blue" onClick={run} disabled={loading || !image || !message}>
        {loading ? <><span className="spinner" /> Encoding…</> : <>🔒 Encode & Hide</>}
      </button>

      <Alert message={error} />

      {result && (
        <div className="result-card">
          <div className="result-header">
            <div className="result-status-dot status-success" />
            <div className="result-title">Encoding Complete</div>
          </div>
          <div className="result-body">
            <img src={result.url} alt="stego" className="stego-preview" />
            <div className="metrics-grid">
              <Metric label="PSNR" value={`${result.psnr} dB`} sub="Imperceptible" />
              <Metric label="Encode Time" value={`${result.ms} ms`} />
              <Metric label="Capacity" value={`${result.cap} B`} sub="at current bpp" />
            </div>
            <a href={result.url} download="stego.png" className="btn-download">
              ⬇ Download Stego Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DECODE PAGE
   ═══════════════════════════════════════════════════════════════════════ */
function DecodePage() {
  const [image,   setImage]   = useState(null);
  const [key,     setKey]     = useState('');
  const [payload, setPayload] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState(false);

  const run = async () => {
    if (!image) return setError('Please upload a stego image.');
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', image); fd.append('payload', payload);
      if (key) fd.append('key', key);
      const data = await apiCall('/decode', fd);
      setResult(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result.message);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div className="page-eyebrow">JUNIWARD Extraction + AES-256</div>
        <h1 className="page-title teal">Extract Hidden Message</h1>
        <p className="page-subtitle">Upload a stego image to recover and decrypt the hidden payload.</p>
      </div>

      <Card title="Stego Image" dotClass="dot-teal" step="01 / 02">
        <ImageUploader onFile={setImage} label="stego image" accentColor="teal" />
      </Card>

      <Card title="Settings" dotClass="dot-teal" step="02 / 02">
        <div style={{ marginBottom:'1rem' }}>
          <label>Encryption Key (if custom)</label>
          <input type="text" placeholder="Leave empty to use system key" value={key} onChange={e => setKey(e.target.value)} />
          <div className="note" style={{marginTop:'0.5rem'}}>
            <span className="note-icon">⚠</span>
            <span>Wrong key will cause a decryption error — no data will be returned.</span>
          </div>
        </div>
        <div>
          <label>Payload bpp (must match encoding)</label>
          <div className="slider-value">{payload} bpp</div>
          <input type="range" min={0.1} max={0.4} step={0.05} value={payload}
            onChange={e => setPayload(parseFloat(e.target.value))} />
          <div className="slider-labels"><span>0.1</span><span>0.4</span></div>
        </div>
      </Card>

      <button className="btn btn-teal" onClick={run} disabled={loading || !image}>
        {loading ? <><span className="spinner" /> Extracting…</> : <>🔓 Extract Message</>}
      </button>

      <Alert message={error} />

      {result && (
        <div className="result-card">
          <div className="result-header">
            <div className="result-status-dot status-success" />
            <div className="result-title">Message Recovered</div>
          </div>
          <div className="result-body">
            <div className="message-box">{result.message}</div>
            <div className="message-meta">
              <span>{result.message_length} bytes recovered</span>
              <span>{result.decoding_time_ms} ms</span>
            </div>
            <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copy}>
              {copied ? '✅ Copied to clipboard!' : '📋 Copy to Clipboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETECT PAGE
   ═══════════════════════════════════════════════════════════════════════ */
function DetectPage() {
  const [image,   setImage]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const run = async () => {
    if (!image) return setError('Please upload an image to analyze.');
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData(); fd.append('image', image); fd.append('confidence_threshold', 0.5);
      const data = await apiCall('/detect', fd);
      setResult(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const isStego = result?.prediction === 'STEGO';
  const conf    = result?.confidence ?? 0;

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div className="page-eyebrow">YedroudjNet · ONNX Runtime · ALASKA2</div>
        <h1 className="page-title purple">AI Steganalysis</h1>
        <p className="page-subtitle">CNN-powered detection — trained on ALASKA2 dataset with Optuna hyperparameter optimization.</p>
      </div>

      <Card title="Image for Analysis" dotClass="dot-purple">
        <ImageUploader onFile={setImage} label="image to analyze" accentColor="purple" />
      </Card>

      <button className="btn btn-purple" onClick={run} disabled={loading || !image}>
        {loading ? <><span className="spinner" /> Analyzing…</> : <>🕵️ Detect Hidden Data</>}
      </button>

      <Alert message={error} />

      {result?.status === 'pending' && (
        <div className="result-card">
          <div className="result-body">
            <div className="pending-badge"><span className="pending-dot" /> Model Integration Pending</div>
            <p style={{color:'var(--text2)', fontSize:'0.85rem'}}>
              YedroudjNet (steganalysis.onnx) has been received from Person 1.
              The /detect endpoint is ready and will activate automatically once the model file
              is placed in <code style={{fontFamily:'JetBrains Mono', color:'var(--purple)'}}>backend/services/</code>.
            </p>
          </div>
        </div>
      )}

      {result?.status === 'success' && (
        <div className="result-card">
          <div className="result-header">
            <div className={`result-status-dot ${isStego ? 'status-danger' : 'status-success'}`} />
            <div className="result-title">Detection Complete</div>
          </div>
          <div className="result-body">
            <div className={`prediction-banner ${isStego ? 'stego' : 'clean'}`}>
              <span className="prediction-icon">{isStego ? '⚠️' : '✅'}</span>
              <div className={`prediction-label ${isStego ? 'stego' : 'clean'}`}>
                {isStego ? 'STEGO DETECTED' : 'CLEAN IMAGE'}
              </div>
              <div className="prediction-sub">
                {isStego
                  ? 'This image appears to contain hidden steganographic data.'
                  : 'No evidence of hidden data found in this image.'}
              </div>
            </div>

            <ConfidenceBar
              value={conf}
              colorClass={isStego ? 'fill-red' : 'fill-green'}
              label="Model Confidence"
            />

            <div className="prob-grid">
              <div className="prob-card">
                <div className="prob-label">Clean Probability</div>
                <div className={`prob-value prob-clean`}>{(result.probabilities.clean * 100).toFixed(1)}%</div>
              </div>
              <div className="prob-card">
                <div className="prob-label">Stego Probability</div>
                <div className={`prob-value prob-stego`}>{(result.probabilities.stego * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="divider" />
            <div className="inference-row">
              <span>Model: <b>YedroudjNet</b></span>
              <span>Backend: <b>{result.inference.backend}</b></span>
              <span>Inference: <b>{result.inference.time_ms} ms</b></span>
              <span>Threshold: <b>{result.inference.threshold_used}</b></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ATTACK PAGE
   ═══════════════════════════════════════════════════════════════════════ */
const ATTACKS = [
  { value:'jpeg_compression', label:'JPEG Compress', icon:'📸', param:{ name:'quality',  label:'Quality',   min:10,  max:100, step:1,    default:75  }},
  { value:'gaussian_noise',   label:'Gaussian Noise', icon:'〜', param:{ name:'sigma',   label:'Sigma',     min:1,   max:50,  step:1,    default:10  }},
  { value:'resize',           label:'Resize Scale',  icon:'⤡', param:{ name:'scale',   label:'Scale',     min:0.25,max:0.9, step:0.05, default:0.5 }},
  { value:'brightness',       label:'Brightness',    icon:'☀', param:{ name:'delta',   label:'Delta',     min:-80, max:80,  step:5,    default:30  }},
];

function AttackPage() {
  const [image,      setImage]      = useState(null);
  const [message,    setMessage]    = useState('');
  const [payload,    setPayload]    = useState(0.2);
  const [attackType, setAttackType] = useState('jpeg_compression');
  const [paramVal,   setParamVal]   = useState(75);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const atk = ATTACKS.find(a => a.value === attackType);

  const run = async () => {
    if (!image || !message) return setError('Please upload a stego image and enter the original message.');
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', image); fd.append('message', message);
      fd.append('attack_type', attackType);
      fd.append('attack_params', JSON.stringify({ [atk.param.name]: paramVal }));
      fd.append('payload', payload);
      const data = await apiCall('/attack', fd);
      setResult(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const berColor = result ? (result.metrics.bit_error_rate < 0.05 ? 'fill-green' : result.metrics.bit_error_rate < 0.2 ? 'fill-yellow' : 'fill-red') : 'fill-blue';

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div className="page-eyebrow">Robustness Testing · BER · PSNR</div>
        <h1 className="page-title orange">Attack Simulation</h1>
        <p className="page-subtitle">Apply image transformations and measure how much hidden data survives.</p>
      </div>

      <Card title="Stego Image" dotClass="dot-orange" step="01 / 03">
        <ImageUploader onFile={setImage} label="stego image" accentColor="orange" />
      </Card>

      <Card title="Original Message & Payload" dotClass="dot-orange" step="02 / 03">
        <label>Original Secret Message</label>
        <textarea rows={3} placeholder="Enter the original secret message for comparison…"
          value={message} onChange={e => setMessage(e.target.value)} />
        <div style={{marginTop:'1rem'}}>
          <label>Encoding Payload (must match)</label>
          <div className="slider-value">{payload} bpp</div>
          <input type="range" min={0.1} max={0.4} step={0.05} value={payload}
            onChange={e => setPayload(parseFloat(e.target.value))} />
        </div>
      </Card>

      <Card title="Attack Configuration" dotClass="dot-orange" step="03 / 03">
        <label>Attack Type</label>
        <div className="attack-grid">
          {ATTACKS.map(a => (
            <button key={a.value}
              className={`attack-btn ${attackType === a.value ? 'selected' : ''}`}
              onClick={() => { setAttackType(a.value); setParamVal(a.param.default); }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
        {atk && (
          <div style={{marginTop:'1rem'}}>
            <label>{atk.param.label}: <span style={{color:'var(--orange)'}}>{paramVal}</span></label>
            <input type="range" min={atk.param.min} max={atk.param.max} step={atk.param.step}
              value={paramVal} onChange={e => setParamVal(parseFloat(e.target.value))} />
          </div>
        )}
      </Card>

      <button className="btn btn-orange" onClick={run} disabled={loading || !image || !message}>
        {loading ? <><span className="spinner" /> Simulating…</> : <>⚔️ Simulate Attack</>}
      </button>

      <Alert message={error} />

      {result && (
        <div className="result-card">
          <div className="result-header">
            <div className={`result-status-dot ${result.metrics.full_recovery ? 'status-success' : 'status-danger'}`} />
            <div className="result-title">Attack Results — {atk?.label}</div>
          </div>
          <div className="result-body">
            <div className="ber-grid">
              <div className="ber-item">
                <div className="ber-label">Bit Error Rate</div>
                <div className="ber-value">{(result.metrics.bit_error_rate*100).toFixed(1)}%</div>
                <div className="ber-sub">{result.metrics.bit_error_rate < 0.05 ? '✅ Excellent' : result.metrics.bit_error_rate < 0.2 ? '⚠ Moderate' : '❌ High'}</div>
              </div>
              <div className="ber-item">
                <div className="ber-label">Char Accuracy</div>
                <div className="ber-value">{(result.metrics.character_accuracy*100).toFixed(0)}%</div>
              </div>
              <div className="ber-item">
                <div className="ber-label">PSNR After</div>
                <div className="ber-value">{result.metrics.psnr_after_attack} dB</div>
              </div>
              <div className="ber-item">
                <div className="ber-label">Full Recovery</div>
                <div className="ber-value">{result.metrics.full_recovery ? '✅ Yes' : '❌ No'}</div>
              </div>
            </div>

            <ConfidenceBar value={result.metrics.character_accuracy} colorClass={berColor} label="Character Accuracy" />

            {result.extracted_preview && (
              <div style={{marginTop:'1rem'}}>
                <div className="preview-label">Extracted Preview</div>
                <div className="preview-box">"{result.extracted_preview}…"</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP
   ═══════════════════════════════════════════════════════════════════════ */
function NavBar({ dark, setDark }) {
  const loc = useLocation();
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <span className="shield">🛡️</span>
        <span className="brand">StegoShield</span>
        <span className="nav-badge">v1.0</span>
      </div>
      <div className="nav-links">
        {[
          { to:'/encode', label:'Encode', icon:'🔒', cls:'enc' },
          { to:'/decode', label:'Decode', icon:'🔓', cls:'dec' },
          { to:'/detect', label:'Detect', icon:'🕵️', cls:'det' },
          { to:'/attack', label:'Attack', icon:'⚔️', cls:'atk' },
        ].map(({ to, label, icon, cls }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `nav-link ${cls}${isActive ? ' active' : ''}`}>
            <span>{icon}</span>
            <span className="label">{label}</span>
          </NavLink>
        ))}
        <button className="theme-toggle" onClick={() => {
          const next = !dark;
          setDark(next);
          document.body.classList.toggle('light', !next);
        }}>
          {dark ? '☀' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  return (
    <Router>
      <GlobalStyles />
      <NavBar dark={dark} setDark={setDark} />
      <Routes>
        <Route path="/"       element={<EncodePage />} />
        <Route path="/encode" element={<EncodePage />} />
        <Route path="/decode" element={<DecodePage />} />
        <Route path="/detect" element={<DetectPage />} />
        <Route path="/attack" element={<AttackPage />} />
      </Routes>
      <footer>
        StegoShield — AI-Driven Secure Steganography &amp; Steganalysis · Person 2 ✅ · Person 3 ✅ · Person 1 ⏳
      </footer>
    </Router>
  );
}