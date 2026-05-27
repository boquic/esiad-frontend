import { Component, inject, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService, OperatorOrder } from '../operator.service';

@Component({
  selector: 'app-operator-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-detail.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    /* ── Page ──────────────────────────────────────────────────── */
    .opd-page {
      padding: 24px 36px 56px;
      max-width: 1280px;
      width: 100%;
      box-sizing: border-box;
    }

    /* ── Breadcrumbs ────────────────────────────────────────────── */
    .opd-crumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: #666;
      margin-bottom: 14px;
    }
    .opd-crumbs a { color: #666; text-decoration: none; }
    .opd-crumbs a:hover { color: #2e7874; }
    .opd-crumbs .sep { color: #999; }
    .opd-crumbs .here { color: #2c2c2c; font-weight: 600; }

    /* ── Page head ──────────────────────────────────────────────── */
    .opd-page-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 22px;
      flex-wrap: wrap;
    }
    .opd-title-row {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .opd-title-icon {
      width: 44px; height: 44px;
      border-radius: 11px;
      background: linear-gradient(135deg,rgba(58,143,139,0.20),rgba(46,120,116,0.12));
      color: #2e7874;
      display: grid; place-items: center;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.30);
      flex-shrink: 0;
    }
    .opd-page-title {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: #2c2c2c;
      margin: 0;
    }
    .opd-page-title .code { font-family: 'Geist Mono','Courier New',monospace; color: #2e7874; }
    .opd-page-title .sep  { color: #999; font-weight: 400; margin: 0 6px; }

    .opd-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px 5px 11px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .opd-status-pill::before {
      content:""; width:7px; height:7px;
      border-radius:50%; background:currentColor;
      box-shadow:0 0 0 3px rgba(58,143,139,0.20);
    }
    .opd-status-pill.s-budgeted        { color:#92400e; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); }
    .opd-status-pill.s-client-review   { color:#9a3412; background:rgba(234,88,12,0.10);  border:1px solid rgba(234,88,12,0.30); }
    .opd-status-pill.s-operator-review { color:#3730a3; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.35);
                                         animation: opdPulse 1.8s ease-in-out infinite; }
    @keyframes opdPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
      50%      { box-shadow: 0 0 0 5px rgba(99,102,241,0.18); }
    }
    .opd-status-pill.s-payment         { color:#6d28d9; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.30); }
    .opd-status-pill.s-pending         { color:#666;    background:rgba(102,102,102,0.10); border:1px solid rgba(102,102,102,0.25); }
    .opd-status-pill.s-in_progress     { color:#1d4ed8; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.30); }
    .opd-status-pill.s-ready           { color:#2f855a; background:rgba(72,187,120,0.14); border:1px solid rgba(47,133,90,0.30); }
    .opd-status-pill.s-delivered       { color:#1a5c7a; background:rgba(26,92,122,0.10);  border:1px solid rgba(26,92,122,0.25); }
    .opd-status-pill.s-cancelled       { color:#b91c1c; background:rgba(239,68,68,0.10);  border:1px solid rgba(239,68,68,0.28); }
    .opd-status-pill.s-expired         { color:#666;    background:rgba(102,102,102,0.10); border:1px solid rgba(102,102,102,0.22); }

    .opd-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      background: rgba(255,255,255,0.6);
      color: #666;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: background .14s, color .14s, border-color .14s;
    }
    .opd-back-btn:hover { background:#fff; color:#2e7874; border-color:#a8c0be; }

    /* ── Alerts ────────────────────────────────────────────────── */
    .opd-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .opd-alert.error   { background:#fff0f0; border:1px solid #f5c6c6; color:#c0392b; }
    .opd-alert.success { background:#f0fdf4; border:1px solid #a7f3d0; color:#065f46; }

    /* ── Loading ───────────────────────────────────────────────── */
    .opd-loading {
      display:flex; flex-direction:column; align-items:center; gap:12px;
      padding:56px; font-size:13px; color:#666;
    }
    @keyframes opdSpin { to { transform: rotate(360deg); } }
    .opd-spinner {
      width:32px; height:32px;
      border:3px solid rgba(58,143,139,0.25);
      border-top-color:#3a8f8b;
      border-radius:50%;
      animation: opdSpin .7s linear infinite;
    }
    .opd-spin {
      animation: opdSpin .7s linear infinite;
      flex-shrink:0;
    }
    .opd-spin-sm {
      display:inline-block;
      width:13px; height:13px;
      border:2px solid rgba(255,255,255,0.4);
      border-top-color:#fff;
      border-radius:50%;
      animation: opdSpin .7s linear infinite;
    }

    /* ── Grid ──────────────────────────────────────────────────── */
    .opd-grid {
      display: grid;
      grid-template-columns: 1.55fr 1fr;
      gap: 18px;
      align-items: start;
    }
    .opd-col { display:flex; flex-direction:column; gap:18px; }

    /* ── Card ──────────────────────────────────────────────────── */
    .opd-card {
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      box-shadow: 0 6px 24px -8px rgba(46,120,116,0.18), 0 1px 2px rgba(74,111,109,0.06);
      padding: 22px 24px;
    }
    .opd-card-head {
      display:flex; align-items:center; justify-content:space-between;
      gap:10px; margin-bottom:18px;
    }
    .opd-card-title {
      font-size:15px; font-weight:600; letter-spacing:-0.005em;
      color:#2c2c2c; display:flex; align-items:center; gap:9px;
    }
    .opd-card-title svg { color:#2e7874; }

    /* ── Specs table ───────────────────────────────────────────── */
    .opd-specs-table {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 0;
      border-top: 1px solid rgba(224,224,224,0.65);
    }
    .opd-specs-table > div {
      padding: 12px 0;
      border-bottom: 1px solid rgba(224,224,224,0.65);
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .opd-specs-table > div:nth-last-child(-n+2) { border-bottom: 0; }
    .opd-specs-table .k { color:#666; font-weight:500; }
    .opd-specs-table .k svg { color:#888; flex-shrink:0; }
    .opd-specs-table .v { color:#2c2c2c; font-weight:500; }
    .opd-specs-table .mono { font-family:'Geist Mono','Courier New',monospace; }
    .opd-specs-table .urgent-val { color:#c0392b; font-weight:600; }
    .opd-unit { font-size:12px; color:#999; margin-left:4px; }

    .opd-urgency-row {
      display:flex; align-items:center; gap:10px;
      background:#fff7e6; border:1px solid #f5d39a;
      border-radius:10px; padding:10px 14px; margin-top:14px;
      font-size:13px; color:#b8860b; font-weight:600;
    }
    .opd-urgency-row svg { flex:0 0 16px; }
    .opd-urgency-row .hint { color:#9a6b00; font-weight:500; margin-left:auto; font-size:12px; }

    .opd-notes-row { margin-top:14px; }
    .opd-notes-label {
      font-size:11.5px; font-weight:600; color:#666;
      text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px;
    }
    .opd-notes-text { font-size:13px; color:#2c2c2c; line-height:1.5; margin:0; }

    .opd-price-note {
      display:flex; align-items:center; gap:8px;
      font-size:11.5px; color:#888; font-style:italic;
      margin-top:14px;
    }

    /* ── Files ─────────────────────────────────────────────────── */
    .opd-file-row {
      display:flex; align-items:center; gap:14px;
      padding:14px 16px;
      background:rgba(58,143,139,0.06);
      border:1px solid rgba(58,143,139,0.18);
      border-radius:11px; margin-bottom:10px;
    }
    .opd-file-icon {
      width:46px; height:54px; border-radius:6px;
      background:#fff; border:1px solid #e0e0e0;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      position:relative; flex-shrink:0;
    }
    .opd-file-icon::before {
      content:""; position:absolute; top:0; right:0;
      width:12px; height:12px; background:#e8e8e8;
      clip-path:polygon(0 0, 100% 100%, 0 100%);
    }
    .opd-file-ext {
      font-size:9px; font-weight:700; color:#c0392b;
      font-family:'Geist Mono','Courier New',monospace;
      margin-top:8px; letter-spacing:0.02em;
    }
    .opd-file-glyph {
      width:18px; height:2px; background:#888;
      margin:1px 0; border-radius:1px;
    }
    .opd-file-glyph.short { width:12px; }
    .opd-file-meta { display:flex; flex-direction:column; gap:3px; min-width:0; flex:1; }
    .opd-file-name {
      font-size:13.5px; font-weight:600; color:#2c2c2c;
      font-family:'Geist Mono','Courier New',monospace;
      letter-spacing:-0.01em;
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    }
    .opd-file-info { font-size:11.5px; color:#666; }

    .opd-verify-note {
      display:flex; align-items:center; gap:8px;
      margin-top:12px; font-size:12px; color:#666;
      padding:8px 12px; border-radius:8px;
      background:rgba(255,247,230,0.5);
      border:1px dashed #f5d39a;
    }
    .opd-verify-note svg { color:#b8860b; flex-shrink:0; }

    .opd-no-files {
      display:flex; flex-direction:column; align-items:center; gap:8px;
      padding:32px; text-align:center; color:#888;
    }
    .opd-no-files svg { opacity:.35; }
    .opd-no-files p { font-size:13px; margin:0; }

    /* ── Notes textarea ────────────────────────────────────────── */
    .opd-privacy-banner {
      display:flex; align-items:center; gap:8px;
      background:rgba(58,143,139,0.10); border:1px solid rgba(58,143,139,0.30);
      border-radius:9px; padding:9px 12px; margin-bottom:12px;
      font-size:12px; color:#2e7874; font-weight:500;
    }
    .opd-privacy-banner svg { flex:0 0 14px; }
    .opd-textarea {
      width:100%; min-height:110px; resize:vertical;
      background:rgba(240,240,240,0.80);
      border:1px solid #e0e0e0; border-radius:10px;
      padding:12px 14px; font-family:inherit;
      font-size:13.5px; color:#2c2c2c; line-height:1.5;
      transition:border-color .15s, box-shadow .15s;
      box-sizing:border-box;
    }
    .opd-textarea:focus {
      outline:0; border-color:#3a8f8b;
      box-shadow:0 0 0 3px rgba(58,143,139,0.18);
      background:#fff;
    }
    .opd-textarea::placeholder { color:#999; }
    .opd-note-actions { display:flex; justify-content:flex-end; margin-top:12px; }

    /* ── Buttons ───────────────────────────────────────────────── */
    .opd-btn {
      font-family:inherit; font-size:13px; font-weight:600;
      padding:10px 18px; border-radius:8px; cursor:pointer;
      display:inline-flex; align-items:center; justify-content:center; gap:8px;
      transition:background .14s, border-color .14s, color .14s, transform .08s;
      border:1px solid transparent; text-decoration:none;
    }
    .opd-btn:active { transform:translateY(1px); }
    .opd-btn:disabled { opacity:.65; cursor:not-allowed; }
    .opd-btn.primary  {
      background:#3a8f8b; color:#fff; border-color:#2e7874;
      box-shadow:0 6px 14px -6px rgba(58,143,139,0.55);
    }
    .opd-btn.primary:hover:not(:disabled) { background:#2e7874; }
    .opd-btn.success  {
      background:#48bb78; color:#fff; border-color:#2f855a;
      box-shadow:0 6px 14px -6px rgba(72,187,120,0.55);
    }
    .opd-btn.success:hover:not(:disabled) { background:#2f855a; }
    .opd-btn.secondary {
      background:transparent; color:#666; border-color:#e0e0e0;
    }
    .opd-btn.secondary:hover { background:rgba(255,255,255,0.6); border-color:#a8c0be; color:#2e7874; }
    .opd-btn.lg { padding:13px 18px; font-size:14px; width:100%; }

    /* ── Stepper ───────────────────────────────────────────────── */
    .opd-stepper {
      display:flex; align-items:flex-start; justify-content:space-between;
      position:relative; padding:10px 0 24px; margin:4px 0 8px;
    }
    .opd-step-track {
      position:absolute; top:22px; left:16px; right:16px;
      height:3px; background:#e8e8e8; border-radius:2px; z-index:0;
    }
    .opd-step-fill {
      height:100%; border-radius:2px;
      background:linear-gradient(90deg,#48bb78,#3a8f8b);
      transition:width .4s ease;
    }
    .opd-step {
      display:flex; flex-direction:column; align-items:center;
      gap:7px; z-index:1; flex:1; position:relative;
    }
    .opd-step-dot {
      width:34px; height:34px; border-radius:50%;
      display:grid; place-items:center;
      font-size:12px; font-weight:700;
      background:#f0f0f0; color:#aaa;
      border:2.5px solid #e0e0e0;
      transition:all .2s;
      box-shadow:0 2px 6px rgba(0,0,0,0.06);
    }
    .opd-step.done .opd-step-dot   { background:#48bb78; color:#fff; border-color:#2f855a; box-shadow:0 2px 8px rgba(72,187,120,0.35); }
    .opd-step.active .opd-step-dot { background:#3a8f8b; color:#fff; border-color:#2e7874; box-shadow:0 0 0 5px rgba(58,143,139,0.18); }
    .opd-step-label {
      font-size:10.5px; font-weight:600; color:#bbb;
      text-transform:uppercase; letter-spacing:0.04em;
      text-align:center; line-height:1.3; max-width:64px;
    }
    .opd-step.done .opd-step-label   { color:#2f855a; }
    .opd-step.active .opd-step-label { color:#2e7874; }

    /* ── Review panel ──────────────────────────────────────────── */
    .opd-review-actions { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
    .opd-review-btn {
      display:inline-flex; align-items:center; gap:6px;
      padding:9px 14px; border-radius:9px; border:1.5px solid;
      font-size:13px; font-weight:600; cursor:pointer;
      font-family:inherit; transition:all .14s;
      background:transparent;
    }
    .opd-review-btn.approve { color:#2f855a; border-color:#a7f3d0; }
    .opd-review-btn.approve.sel, .opd-review-btn.approve:hover { background:#48bb78; color:#fff; border-color:#2f855a; }
    .opd-review-btn.return  { color:#92400e; border-color:#fcd34d; }
    .opd-review-btn.return.sel, .opd-review-btn.return:hover  { background:#f59e0b; color:#fff; border-color:#b45309; }
    .opd-review-btn.reject  { color:#b91c1c; border-color:#fca5a5; }
    .opd-review-btn.reject.sel, .opd-review-btn.reject:hover  { background:#ef4444; color:#fff; border-color:#b91c1c; }

    .opd-price-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
    .opd-price-box {
      padding:11px 14px; border-radius:10px;
      border:1px solid #e0e0e0; background:rgba(255,255,255,0.7);
    }
    .opd-price-box.adjusted { border-color:#fca5a5; background:rgba(254,242,242,0.5); }
    .opd-price-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#9ca3af; margin-bottom:4px; }
    .opd-price-label.red { color:#dc2626; }
    .opd-price-val { font-size:17px; font-weight:800; font-family:'Geist Mono','Courier New',monospace; color:#2c2c2c; }
    .opd-price-val.red { color:#dc2626; }

    .opd-client-notes {
      display:flex; gap:8px; align-items:flex-start;
      padding:10px 13px; border-radius:9px; margin-bottom:14px;
      background:rgba(255,247,237,0.85); border:1px solid #fdba74;
      font-size:13px; color:#92400e; line-height:1.45;
    }
    .opd-client-notes svg { flex:0 0 15px; margin-top:1px; color:#d97706; }

    /* ── State explain ─────────────────────────────────────────── */
    .opd-state-explain {
      background:rgba(58,143,139,0.10); border:1px solid rgba(58,143,139,0.30);
      border-radius:9px; padding:11px 13px; margin-bottom:14px;
      font-size:12.5px; color:#2e7874; line-height:1.45;
      display:flex; gap:9px; align-items:start;
    }
    .opd-state-explain svg { flex:0 0 14px; margin-top:1px; }

    .opd-warning-line {
      margin-top:9px; text-align:center;
      font-size:11.5px; color:#888;
      display:flex; align-items:center; justify-content:center; gap:5px;
    }

    .opd-done-box {
      display:flex; flex-direction:column; align-items:center;
      gap:6px; padding:20px;
      background:#f0fdf4; border:1px solid #a7f3d0;
      border-radius:10px; text-align:center;
    }
    .opd-done-title { font-size:14px; font-weight:600; color:#065f46; margin:0; }
    .opd-done-sub   { font-size:12px; color:#888; margin:0; }

    /* ── Client ────────────────────────────────────────────────── */
    .opd-client-box {
      display:flex; align-items:center; gap:14px;
      padding:14px; background:rgba(255,255,255,0.55);
      border:1px solid #e0e0e0; border-radius:11px;
    }
    .opd-client-av {
      width:48px; height:48px; border-radius:50%;
      background:linear-gradient(135deg,#a8c0be,#6b8f8c);
      color:#fff; display:grid; place-items:center;
      font-size:14px; font-weight:700;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,0.25);
      flex-shrink:0;
    }
    .opd-client-name { font-size:14px; font-weight:600; color:#2c2c2c; }
    .opd-client-role { font-size:11.5px; color:#666; margin-top:1px; }
    .opd-client-privacy {
      display:flex; align-items:flex-start; gap:8px;
      margin-top:12px; font-size:11.5px; color:#666;
      padding:9px 12px; border-radius:9px;
      background:rgba(255,255,255,0.4);
      border:1px dashed #e0e0e0; line-height:1.45;
    }
    .opd-client-privacy svg { flex:0 0 14px; color:#2e7874; margin-top:1px; }

    /* ── Timeline ──────────────────────────────────────────────── */
    .opd-timeline {
      display:flex; flex-direction:column; gap:0;
      position:relative;
    }
    .opd-timeline::before {
      content:""; position:absolute; left:9px; top:6px; bottom:6px;
      width:2px;
      background:linear-gradient(180deg,#3a8f8b 0%,#a8c0be 100%);
      border-radius:2px; opacity:.35;
    }
    .opd-tl-row {
      display:grid; grid-template-columns:24px 1fr;
      gap:10px; padding:9px 0; position:relative;
    }
    .opd-tl-dot {
      width:14px; height:14px; border-radius:50%;
      background:#fff; border:3px solid #a8c0be;
      margin-top:3px; margin-left:2px; z-index:1;
    }
    .opd-tl-row.latest .opd-tl-dot {
      background:#3a8f8b; border-color:#2e7874;
      box-shadow:0 0 0 4px rgba(58,143,139,0.20);
    }
    .opd-tl-when {
      font-size:11.5px; color:#666;
      font-family:'Geist Mono','Courier New',monospace;
      letter-spacing:-0.01em;
    }
    .opd-tl-what {
      font-size:13px; color:#2c2c2c;
      font-weight:500; margin-top:2px; line-height:1.4;
    }
    .opd-tl-what b { color:#2e7874; font-weight:600; }

    /* ── Modal ─────────────────────────────────────────────────── */
    .opd-modal-backdrop {
      position:fixed; inset:0; z-index:50;
      display:flex; align-items:center; justify-content:center;
      padding:16px;
      background:rgba(0,0,0,0.4); backdrop-filter:blur(4px);
    }
    @keyframes opdModalIn {
      from { opacity:0; transform:scale(0.95) translateY(-8px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
    .opd-modal {
      background:#fff; border-radius:20px;
      padding:28px 24px 24px; max-width:380px; width:100%;
      box-shadow:0 20px 60px rgba(0,0,0,0.22);
      display:flex; flex-direction:column; align-items:center;
      gap:10px; text-align:center;
      animation:opdModalIn 0.18s cubic-bezier(0.4,0,0.2,1);
    }
    .opd-modal-icon {
      width:52px; height:52px; border-radius:50%;
      background:#f0fdf4; display:grid; place-items:center; margin-bottom:4px;
    }
    .opd-modal-title { font-size:17px; font-weight:700; color:#1f2937; margin:0; }
    .opd-modal-desc  { font-size:13.5px; color:#6b7280; line-height:1.5; margin:0; }
    .opd-modal-actions {
      display:flex; gap:10px; margin-top:8px; width:100%;
    }
    .opd-modal-actions .opd-btn { flex:1; padding:11px 16px; }

    @media (max-width: 1200px) {
      .opd-grid {
        grid-template-columns: 1fr;
      }
      .opd-specs-table {
        grid-template-columns: 1fr;
      }
      .opd-specs-table > div {
        padding: 10px 0;
      }
      .opd-specs-table .v,
      .opd-specs-table .v.mono {
        white-space: normal;
      }
      .opd-order-header,
      .opd-client-box,
      .opd-file-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .opd-order-actions {
        min-width: 0;
      }
    }

    @media (max-width: 760px) {
      .opd-page {
        padding: 18px 16px 40px;
      }
      .opd-page-head {
        gap: 14px;
      }
      .opd-card {
        padding: 18px 16px;
      }
      .opd-specs-table {
        gap: 0;
      }
      .opd-specs-table > div {
        font-size: 13px;
      }
      .opd-status-pill {
        width: fit-content;
      }
    }
  `],
})
export class OperatorOrderDetailComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private operatorService = inject(OperatorService);
  private cd              = inject(ChangeDetectorRef);

  orderId: string | null      = null;
  order: OperatorOrder | null = null;

  isLoading        = true;
  error: string | null   = null;
  success: string | null = null;

  internalNotes    = '';
  isSavingNotes    = false;
  isChangingStatus = false;
  showReadyModal   = false;

  // ── Review (OPERATOR_REVIEW_PENDING) ────────────────────────────────────
  showReviewPanel      = false;
  reviewAction: 'APPROVE' | 'RETURN_TO_CLIENT' | 'REJECT' | '' = '';
  reviewNotes          = '';
  isSubmittingReview   = false;

  // ── Adjust Price ─────────────────────────────────────────────────────────
  showPricePanel       = false;
  priceAdjustValue: number | null = null;
  priceAdjustReason    = '';
  isSubmittingPrice    = false;

  // ── Production Time ──────────────────────────────────────────────────────
  showProductionTimePanel   = false;
  productionTimeValue       = '';
  estimatedDeliveryAtValue  = '';
  isSubmittingProductionTime = false;

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.error     = 'No se proporcionó un ID de pedido.';
      this.isLoading = false;
      this.cd.markForCheck();
    }
  }

  loadOrder(id: string): void {
    this.isLoading = true;
    this.error     = null;

    this.operatorService.getOrderById(id).subscribe({
      next: (response) => {
        this.order        = (response?.data !== undefined ? response.data : response) as OperatorOrder;
        this.internalNotes = this.order?.operator_notes || this.order?.notes || '';
        this.isLoading    = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.error     = 'Error al cargar los detalles del pedido.';
        this.isLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  get clientInitials(): string {
    if (!this.order?.client) return 'CL';
    const f = this.order.client.first_name?.[0] ?? '';
    const l = this.order.client.last_name?.[0] ?? '';
    return (f + l).toUpperCase() || 'CL';
  }

  get isUrgent(): boolean {
    if (!this.order?.estimated_delivery_at) return false;
    const diff = this.diffDays(this.order.estimated_delivery_at);
    return diff < 0 || diff <= 1;
  }

  get urgencyText(): string {
    if (!this.order?.estimated_delivery_at) return '';
    const diff = this.diffDays(this.order.estimated_delivery_at);
    if (diff < 0) return `Vencido hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`;
    if (diff === 0) return 'Vence hoy';
    return `Vence en ${diff} día${diff !== 1 ? 's' : ''}`;
  }

  private diffDays(isoDate: string): number {
    const now      = new Date();
    const delivery = new Date(isoDate);
    return Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      BUDGETED:                 'Presupuestado',
      CLIENT_REVIEW_PENDING:    'Revisión del cliente',
      OPERATOR_REVIEW_PENDING:  'Pendiente de revisión',
      PENDING_PAYMENT:          'Pendiente de pago',
      IN_PROGRESS:              'En producción',
      READY:                    'Listo para recoger',
      DELIVERED:                'Entregado',
      CANCELLED:                'Cancelado',
      EXPIRED:                  'Vencido',
    };
    return map[status] ?? status;
  }

  fileExt(file: any): string {
    if (!file?.file_type) return 'FILE';
    return file.file_type.replace('PLAN_', '').toUpperCase();
  }

  // ── Status pill CSS class ────────────────────────────────────
  statusPillClass(status: string): string {
    const map: Record<string, string> = {
      BUDGETED:                's-budgeted',
      CLIENT_REVIEW_PENDING:   's-client-review',
      OPERATOR_REVIEW_PENDING: 's-operator-review',
      PENDING_PAYMENT:         's-payment',
      IN_PROGRESS:             's-in_progress',
      READY:                   's-ready',
      DELIVERED:               's-delivered',
      CANCELLED:               's-cancelled',
      EXPIRED:                 's-expired',
    };
    return map[status] ?? 's-budgeted';
  }

  // ── Stepper ──────────────────────────────────────────────────
  // 4 pasos visibles: Revisión | Producción | Listo | Entregado
  private readonly statusOrder = [
    'BUDGETED', 'CLIENT_REVIEW_PENDING', 'OPERATOR_REVIEW_PENDING',
    'PENDING_PAYMENT', 'IN_PROGRESS', 'READY', 'DELIVERED'
  ];

  // Mapa de estado → índice de paso (0-based, de 4 pasos)
  private readonly stepMap: Record<string, number> = {
    BUDGETED: 0, CLIENT_REVIEW_PENDING: 0, OPERATOR_REVIEW_PENDING: 0,
    PENDING_PAYMENT: 1, IN_PROGRESS: 1,
    READY: 2,
    DELIVERED: 3,
    CANCELLED: -1, EXPIRED: -1,
  };

  get currentStep(): number {
    return this.stepMap[this.order?.status ?? ''] ?? 0;
  }

  stepState(step: number): 'done' | 'active' | 'pending' {
    const cur = this.currentStep;
    if (step < cur) return 'done';
    if (step === cur) return 'active';
    return 'pending';
  }

  get stepLineWidth(): string {
    const pct = [0, 33, 67, 100];
    return `${pct[Math.min(this.currentStep, 3)]}%`;
  }

  // ── Timeline helpers ─────────────────────────────────────────
  get timelineEvents(): Array<{ when: string | null; what: string; isLatest?: boolean }> {
    if (!this.order) return [];
    const s = this.order.status;
    const events: Array<{ when: string | null; what: string; isLatest?: boolean }> = [];

    events.push({ when: this.order.created_at ?? null, what: 'Pedido <b>creado</b> por el cliente' });

    if (['CLIENT_REVIEW_PENDING','OPERATOR_REVIEW_PENDING','PENDING_PAYMENT','IN_PROGRESS','READY','DELIVERED'].includes(s)) {
      events.push({ when: this.order.client_reviewed_at ?? null, what: 'Cliente <b>confirmó</b> la revisión' });
    }
    if (['OPERATOR_REVIEW_PENDING','PENDING_PAYMENT','IN_PROGRESS','READY','DELIVERED'].includes(s)) {
      // Solo si llegó a revisión del operario
      events.push({ when: null, what: 'En <b>revisión del operario</b>' });
    }
    if (['PENDING_PAYMENT','IN_PROGRESS','READY','DELIVERED'].includes(s)) {
      events.push({ when: this.order.operator_reviewed_at ?? null, what: 'Operario <b>aprobó</b> la revisión' });
    }
    if (['IN_PROGRESS','READY','DELIVERED'].includes(s)) {
      events.push({ when: this.order.production_started_at ?? null, what: 'Producción <b>iniciada</b>' });
    }
    if (['READY','DELIVERED'].includes(s)) {
      events.push({ when: this.order.production_ready_at ?? null, what: 'Pedido marcado como <b>listo</b>' });
    }
    if (s === 'DELIVERED') {
      events.push({ when: null, what: 'Pedido <b>entregado</b> al cliente' });
    }
    if (s === 'CANCELLED') {
      events.push({ when: null, what: 'Pedido <b>cancelado</b>' });
    }

    // Marcar el último como latest
    if (events.length > 0) events[events.length - 1].isLatest = true;
    return events;
  }

  // ── Actions ──────────────────────────────────────────────────
  startOrder(): void {
    if (!this.orderId) return;
    this.isChangingStatus = true;
    this.error = null; this.success = null;

    this.operatorService.updateOrderStatus(this.orderId, 'IN_PROGRESS').subscribe({
      next: () => {
        this.success = 'Producción iniciada correctamente.';
        this.isChangingStatus = false;
        if (this.order) this.order.status = 'IN_PROGRESS';
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo iniciar la producción.';
        this.isChangingStatus = false;
      }
    });
  }

  openReadyModal():  void { this.showReadyModal = true;  }
  closeReadyModal(): void { this.showReadyModal = false; }

  confirmMarkAsReady(): void {
    if (!this.orderId) return;
    this.isChangingStatus = true;
    this.success = null; this.error = null;
    this.closeReadyModal();

    this.operatorService.updateOrderStatus(this.orderId, 'READY').subscribe({
      next: () => {
        this.success = 'El pedido ha sido marcado como LISTO para recoger.';
        this.isChangingStatus = false;
        if (this.order) this.order.status = 'READY';
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cambiar el estado del pedido.';
        this.isChangingStatus = false;
      }
    });
  }

  saveNotes(): void {
    if (!this.orderId) return;
    this.isSavingNotes = true;
    this.success = null; this.error = null;

    this.operatorService.updateOrderNotes(this.orderId, this.internalNotes).subscribe({
      next: () => {
        this.success = 'Notas guardadas correctamente.';
        this.isSavingNotes = false;
        if (this.order) this.order.operator_notes = this.internalNotes;
      },
      error: () => {
        this.error = 'No se pudieron guardar las notas.';
        this.isSavingNotes = false;
      }
    });
  }

  // ── Review ────────────────────────────────────────────────────
  get reviewNotesRequired(): boolean {
    return this.reviewAction === 'RETURN_TO_CLIENT' || this.reviewAction === 'REJECT';
  }

  submitReview(): void {
    if (!this.orderId || !this.reviewAction) return;
    if (this.reviewNotesRequired && !this.reviewNotes.trim()) {
      this.error = 'Debes ingresar una nota para esta acción.';
      return;
    }
    this.isSubmittingReview = true;
    this.error = null; this.success = null;

    this.operatorService.reviewOrder(this.orderId, this.reviewAction as 'APPROVE' | 'RETURN_TO_CLIENT' | 'REJECT', this.reviewNotes.trim() || undefined).subscribe({
      next: () => {
        const msg: Record<string, string> = {
          APPROVE:           'Revisión aprobada. El pedido avanzó al siguiente estado.',
          RETURN_TO_CLIENT:  'Pedido devuelto al cliente.',
          REJECT:            'Pedido rechazado/cancelado.',
        };
        this.success = msg[this.reviewAction] ?? 'Acción realizada.';
        this.isSubmittingReview = false;
        this.showReviewPanel = false;
        this.reviewAction = '';
        this.reviewNotes = '';
        if (this.orderId) this.loadOrder(this.orderId);
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'No se pudo procesar la revisión.';
        this.isSubmittingReview = false;
      }
    });
  }

  // ── Adjust Price ──────────────────────────────────────────────
  submitPriceAdjust(): void {
    if (!this.orderId) return;
    if (!this.priceAdjustValue || this.priceAdjustValue <= 0) {
      this.error = 'El precio final debe ser mayor a 0.';
      return;
    }
    if (!this.priceAdjustReason.trim()) {
      this.error = 'El motivo del ajuste es requerido.';
      return;
    }
    this.isSubmittingPrice = true;
    this.error = null; this.success = null;

    this.operatorService.adjustOrderPrice(this.orderId, this.priceAdjustValue, this.priceAdjustReason.trim()).subscribe({
      next: () => {
        this.success = 'Precio ajustado. El pedido volvió a revisión del cliente.';
        this.isSubmittingPrice = false;
        this.showPricePanel = false;
        this.priceAdjustValue = null;
        this.priceAdjustReason = '';
        if (this.orderId) this.loadOrder(this.orderId);
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'No se pudo ajustar el precio.';
        this.isSubmittingPrice = false;
      }
    });
  }

  // ── Production Time ───────────────────────────────────────────
  submitProductionTime(): void {
    if (!this.orderId) return;
    if (!this.productionTimeValue.trim()) {
      this.error = 'El tiempo estimado es requerido.';
      return;
    }
    this.isSubmittingProductionTime = true;
    this.error = null; this.success = null;

    this.operatorService.updateProductionTime(
      this.orderId,
      this.productionTimeValue.trim(),
      this.estimatedDeliveryAtValue.trim() || undefined
    ).subscribe({
      next: () => {
        this.success = 'Tiempo de producción registrado.';
        this.isSubmittingProductionTime = false;
        this.showProductionTimePanel = false;
        if (this.order) {
          this.order.production_time_estimate = this.productionTimeValue.trim();
          if (this.estimatedDeliveryAtValue) this.order.estimated_delivery_at = this.estimatedDeliveryAtValue;
        }
        this.productionTimeValue = '';
        this.estimatedDeliveryAtValue = '';
      },
      error: (err: any) => {
        this.error = err?.error?.message ?? 'No se pudo registrar el tiempo.';
        this.isSubmittingProductionTime = false;
      }
    });
  }
}
