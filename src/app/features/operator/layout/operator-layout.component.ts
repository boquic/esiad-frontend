import {
  Component, inject, OnInit, OnDestroy, ChangeDetectorRef,
  HostListener, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { getUserName } from '../../../core/utils/jwt.utils';
import { OperatorService } from '../operator.service';

type NotificationHistoryItem = {
  id: string;
  orderId: string;
  type: 'quotation' | 'payment';
  message: string;
  createdAt: number;
  read: boolean;
};

@Component({
  selector: 'app-operator-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  template: `
<!-- Orbs decorativos de fondo -->
<div class="op-orb-tr"></div>
<div class="op-orb-bl"></div>

<!-- Avisos de nuevos pedidos enviados a cotización -->
<div class="op-toast-stack">
  <div *ngFor="let toast of notificationToasts" class="op-toast" (click)="goToToastOrder(toast.orderId)">
    <div class="op-toast-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>
        <path d="M10 21a2 2 0 0 0 4 0"/>
      </svg>
    </div>
    <div class="op-toast-body">
      <div class="op-toast-title">Nuevo pedido a cotizar</div>
      <div class="op-toast-msg">{{ toast.message }}</div>
    </div>
    <button class="op-toast-close" (click)="dismissToast(toast.id); $event.stopPropagation()" title="Cerrar">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </div>
</div>

<div class="op-shell" [class.collapsed]="sidebarCollapsed">

  <!-- ============ SIDEBAR ============ -->
  <aside class="op-sidebar" [class.collapsed]="sidebarCollapsed">

    <!-- Brand -->
    <div class="op-brand">
      <div class="op-brand-logo">
        <svg viewBox="0 0 428 451" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(255,255,255,0.90)"
            d="M338.218 86.729C353.860 151.409 369.416 215.681 384.971 279.952C387.940 292.221 390.840 304.508 393.925 316.748C394.662 319.674 394.106 321.339 391.516 323.246C342.890 359.051 294.371 395.001 245.789 430.866C244.406 431.887 242.581 432.900 240.955 432.912C221.480 433.052 202.004 433.003 182.064 433.003C182.064 369.741 182.064 306.693 182.064 243.220C156.523 243.220 131.441 243.220 105.659 243.220C107.631 233.666 109.492 224.650 111.443 215.205C134.681 215.205 157.935 215.205 181.566 215.205C181.566 166.065 181.566 117.367 181.566 68.412C164.103 68.412 146.678 68.412 128.856 68.412C106.826 160.919 84.787 253.467 62.575 346.739C52.509 338.510 43.019 330.505 33.228 322.886C29.935 320.323 28.894 318.131 29.946 313.833C53.059 219.445 75.997 125.015 98.886 30.573C99.523 27.944 100.184 26.613 103.295 26.620C148.621 26.727 193.947 26.697 239.273 26.709C239.928 26.709 240.584 26.842 241.638 26.956C241.638 144.742 241.638 262.488 241.638 381.252C249.964 375.502 257.571 370.299 265.125 365.020C292.395 345.965 319.630 326.860 346.938 307.860C349.227 306.268 350.237 305.024 349.516 301.891C331.779 224.821 314.193 147.716 296.482 70.186C286.269 70.186 276.011 70.186 265.410 70.186C265.410 55.538 265.410 41.333 265.410 26.911C284.804 26.911 304.074 26.911 323.830 26.911C328.591 46.687 333.361 66.504 338.218 86.729Z"/>
        </svg>
      </div>
      <div *ngIf="!sidebarCollapsed">
        <div class="op-brand-name">ESIAD ARQ</div>
        <div class="op-brand-sub">Operario</div>
      </div>
    </div>

    <!-- Nav label -->
    <div class="op-nav-label">Trabajo</div>

    <!-- Nav -->
    <nav class="op-nav">

      <!-- Cola de trabajo -->
      <a routerLink="/operator/dashboard"
         class="op-nav-link"
         [class.active]="isActive('/operator/dashboard')">
        <svg class="op-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M3 12h18M3 18h12"/>
        </svg>
        <span class="op-nav-text">Mi cola de trabajo</span>
        <span *ngIf="assignedCount > 0" class="op-nav-badge">{{ assignedCount }}</span>
      </a>

      <!-- Historial -->
      <a routerLink="/operator/history"
         class="op-nav-link"
         [class.active]="isActive('/operator/history')">
        <svg class="op-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
        </svg>
        <span class="op-nav-text">Historial</span>
      </a>

      <!-- Mi perfil -->
      <a routerLink="/operator/profile"
         class="op-nav-link"
         [class.active]="isActive('/operator/profile')">
        <svg class="op-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
        </svg>
        <span class="op-nav-text">Mi perfil</span>
      </a>

    </nav>

    <!-- Sidebar footer -->
    <div class="op-side-foot">
      <div class="op-specs-label">Mis especialidades</div>
      <div class="op-specs">
        <span class="op-spec-chip">Láser</span>
        <span class="op-spec-chip">Ploteo</span>
      </div>

      <div class="op-user-card">
        <div class="op-user-av">{{ userInitials }}</div>
        <div class="op-user-info">
          <div class="op-user-name">{{ userName }}</div>
          <div class="op-user-role">Operario · turno mañana</div>
        </div>
      </div>
    </div>

  </aside>

  <!-- ============ MAIN ============ -->
  <main style="display:flex;flex-direction:column;min-width:0;overflow:hidden;">

    <!-- Header -->
    <header class="op-navbar">

      <!-- Toggle sidebar -->
      <button class="op-collapse-btn"
              (click)="toggleSidebar()"
              [title]="sidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
      </button>

      <!-- Separador -->
      <div style="width:1px;height:18px;background:rgba(255,255,255,0.10);flex-shrink:0;"></div>

      <!-- Breadcrumbs -->
      <div class="op-crumbs">
        <span>Operario</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:.35;">
          <path d="M9 18l6-6-6-6"/>
        </svg>
        <span class="here">{{ pageTitle }}</span>
      </div>

      <div class="op-nav-right">

        <!-- Notifications -->
        <button class="op-icon-btn" title="Notificaciones" (click)="toggleNotificationsPanel()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>
            <path d="M10 21a2 2 0 0 0 4 0"/>
          </svg>
          <span *ngIf="unreadNotificationsCount > 0" class="op-bell-badge">{{ unreadNotificationsCount }}</span>
        </button>

        <!-- Backdrop del panel de notificaciones -->
        <div *ngIf="showNotificationsPanel"
             style="position:fixed;inset:0;z-index:40;"
             (click)="closeNotificationsPanel()">
        </div>

        <!-- Panel de notificaciones -->
        <div *ngIf="showNotificationsPanel" class="op-notif-dropdown">
          <div class="op-notif-header">
            <span>Notificaciones</span>
            <button *ngIf="notificationHistory.length > 0" class="op-notif-clear" (click)="clearNotificationHistory()">
              Limpiar
            </button>
          </div>
          <div class="op-notif-list">
            <div *ngIf="notificationHistory.length === 0" class="op-notif-empty">
              Aún no tienes notificaciones. Aquí verás cuando un cliente te envíe un pedido a cotizar o un comprobante de pago.
            </div>
            <button *ngFor="let n of notificationHistory" class="op-notif-item" [class.unread]="!n.read"
                    (click)="openNotification(n)">
              <div class="op-notif-icon" [class.payment]="n.type === 'payment'">
                <svg *ngIf="n.type === 'quotation'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/>
                </svg>
                <svg *ngIf="n.type === 'payment'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>
                </svg>
              </div>
              <div class="op-notif-body">
                <div class="op-notif-msg">{{ n.message }}</div>
                <div class="op-notif-time">{{ formatNotificationTime(n.createdAt) }}</div>
              </div>
              <span *ngIf="!n.read" class="op-notif-dot"></span>
            </button>
          </div>
        </div>

        <!-- Avatar chip -->
        <button class="op-avatar-chip" (click)="toggleUserMenu()">
          <div class="op-avatar">{{ userInitials }}</div>
          <div>
            <div class="op-chip-name">{{ userName }}</div>
            <div class="op-chip-role">Operario</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               [style.transform]="showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'"
               style="opacity:.7;transition:transform .16s;">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>

        <!-- Backdrop -->
        <div *ngIf="showUserMenu"
             style="position:fixed;inset:0;z-index:40;"
             (click)="closeUserMenu()">
        </div>

        <!-- Dropdown -->
        <div *ngIf="showUserMenu" class="op-user-dropdown">
          <div class="op-dd-header">
            <div class="op-dd-av">{{ userInitials }}</div>
            <div>
              <div class="op-dd-name">{{ userName }}</div>
              <div class="op-dd-role">Operario SIGEPED</div>
            </div>
          </div>

          <div class="op-dd-section">
            <a routerLink="/operator/profile" class="op-dd-item" (click)="closeUserMenu()">
              <div class="op-dd-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
                </svg>
              </div>
              <div>
                <div class="op-dd-label">Mi perfil</div>
                <div class="op-dd-sub">Ver información de cuenta</div>
              </div>
            </a>
          </div>

          <div class="op-dd-divider"></div>

          <div class="op-dd-section">
            <button class="op-dd-item op-dd-item-danger" (click)="logout()">
              <div class="op-dd-icon op-dd-icon-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </div>
              <div>
                <div class="op-dd-label">Cerrar sesión</div>
                <div class="op-dd-sub">Salir del panel operario</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </header>

    <!-- Page content -->
    <router-outlet></router-outlet>

  </main>

</div>
  `,
  styles: [`
    /* ── Background ────────────────────────────────────────────── */
    body {
      background: linear-gradient(160deg,#f8faf9 0%,#f1f6f4 55%,#eaf1ee 100%);
      background-attachment: fixed;
      min-height: 100vh;
    }

    /* Orbs decorativos (mismo estilo que client y admin) */
    .op-orb-tr {
      position: fixed;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: #b8d8d4;
      top: -160px; right: -100px;
      opacity: .18;
      filter: blur(90px);
      pointer-events: none;
      z-index: 0;
    }
    .op-orb-bl {
      position: fixed;
      width: 480px; height: 480px;
      border-radius: 50%;
      background: #7ab8b4;
      bottom: -160px; left: -120px;
      opacity: .13;
      filter: blur(90px);
      pointer-events: none;
      z-index: 0;
    }

    /* ── Toasts: nuevo pedido enviado a cotización ───────────────── */
    .op-toast-stack {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 340px;
    }
    @keyframes opToastIn {
      from { opacity:0; transform:translateX(24px) scale(0.98); }
      to   { opacity:1; transform:translateX(0) scale(1); }
    }
    .op-toast {
      display: flex;
      align-items: flex-start;
      gap: 11px;
      padding: 14px 14px 14px 16px;
      border-radius: 14px;
      background: rgba(22,58,55,0.97);
      backdrop-filter: blur(18px) saturate(150%);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 10px 32px -8px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.12);
      cursor: pointer;
      animation: opToastIn 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .op-toast-icon {
      width: 34px; height: 34px;
      flex-shrink: 0;
      border-radius: 10px;
      background: rgba(58,143,139,0.28);
      color: #cce8e6;
      display: grid;
      place-items: center;
    }
    .op-toast-body { min-width: 0; flex: 1; }
    .op-toast-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #cce8e6;
      margin-bottom: 2px;
    }
    .op-toast-msg {
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      line-height: 1.4;
    }
    .op-toast-close {
      flex-shrink: 0;
      width: 22px; height: 22px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.55);
      cursor: pointer;
    }
    .op-toast-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

    /* ── Page enter animation ──────────────────────────────────── */
    @keyframes opPageIn {
      from { opacity:0; transform:translateY(6px); }
      to   { opacity:1; transform:translateY(0); }
    }
    app-operator-dashboard,
    app-operator-history,
    app-operator-order-detail,
    app-operator-profile {
      display: block;
      animation: opPageIn 0.18s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Shell grid ──────────────────────────────────────────────── */
    .op-shell {
      display: grid;
      grid-template-columns: 220px 1fr;
      min-height: 100vh;
      position: relative;
      z-index: 1;
      transition: grid-template-columns .22s cubic-bezier(0.4,0,0.2,1);
    }
    .op-shell.collapsed {
      grid-template-columns: 62px 1fr;
    }

    /* ── Sidebar ─────────────────────────────────────────────────── */
    .op-sidebar {
      background: rgba(22,58,55,0.94);
      backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%);
      color: #e6f0ee;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      box-shadow: inset -1px 0 0 rgba(255,255,255,0.05), 2px 0 20px rgba(0,0,0,0.15);
      overflow-y: auto;
      overflow-x: hidden;
      transition: width .22s cubic-bezier(0.4,0,0.2,1);
    }

    /* Brand */
    .op-brand {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 18px;
      height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .op-brand-logo {
      width: 30px; height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .op-brand-name {
      font-weight: 700;
      letter-spacing: 0.06em;
      font-size: 14px;
      color: #fff;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .op-brand-sub {
      font-size: 10px;
      color: rgba(255,255,255,0.45);
      margin-top: 1px;
      letter-spacing: 0.04em;
      font-weight: 500;
    }

    /* Nav label */
    .op-nav-label {
      font-size: 10.5px;
      letter-spacing: 0.10em;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase;
      padding: 18px 18px 8px;
      font-weight: 600;
      white-space: nowrap;
    }

    /* Nav */
    .op-nav {
      display: flex;
      flex-direction: column;
      padding: 0 8px;
      gap: 2px;
    }
    .op-nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      color: rgba(255,255,255,0.60);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      transition: background .14s, color .14s;
      white-space: nowrap;
      overflow: hidden;
    }
    .op-nav-link:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.90);
    }
    .op-nav-link.active {
      background: rgba(58,143,139,0.28);
      color: #fff;
      box-shadow: inset 2px 0 0 #3a8f8b;
      font-weight: 600;
    }
    .op-nav-icon {
      width: 17px; height: 17px;
      flex-shrink: 0;
      opacity: .85;
    }
    .op-nav-badge {
      margin-left: auto;
      font-size: 11px;
      background: rgba(255,255,255,0.12);
      color: #fff;
      padding: 1px 7px;
      border-radius: 999px;
      font-weight: 700;
      font-family: 'Geist Mono', monospace;
      line-height: 1.6;
    }
    .op-nav-link.active .op-nav-badge {
      background: #3a8f8b;
    }

    /* Sidebar footer */
    .op-side-foot {
      margin-top: auto;
      padding: 18px;
      border-top: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .op-specs-label {
      font-size: 10.5px;
      letter-spacing: 0.10em;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 8px;
      white-space: nowrap;
    }
    .op-specs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
    }
    .op-spec-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(58,143,139,0.28);
      color: #cce8e6;
      border: 1px solid rgba(58,143,139,0.45);
      white-space: nowrap;
    }
    .op-spec-chip::before {
      content:"";
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #3a8f8b;
    }
    .op-user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 10px;
      background: rgba(255,255,255,0.05);
    }
    .op-user-av {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      color: #fff; font-size: 12px; font-weight: 600;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
      flex-shrink: 0;
    }
    .op-user-name {
      font-size: 12.5px; font-weight: 600;
      color: #fff; line-height: 1.2;
      white-space: nowrap;
    }
    .op-user-role {
      font-size: 10.5px;
      color: rgba(255,255,255,0.55);
      white-space: nowrap;
    }

    /* ── Collapsed sidebar ───────────────────────────────────────── */
    .op-sidebar.collapsed {
      align-items: center;
    }
    .op-sidebar.collapsed .op-brand {
      justify-content: center;
      padding: 18px 10px;
    }
    .op-sidebar.collapsed .op-brand-text,
    .op-sidebar.collapsed .op-nav-label,
    .op-sidebar.collapsed .op-nav-text,
    .op-sidebar.collapsed .op-nav-badge,
    .op-sidebar.collapsed .op-specs-label,
    .op-sidebar.collapsed .op-specs,
    .op-sidebar.collapsed .op-user-info {
      display: none;
    }
    .op-sidebar.collapsed .op-nav {
      padding: 0 4px;
    }
    .op-sidebar.collapsed .op-nav-link {
      justify-content: center;
      padding: 9px 8px;
    }
    .op-sidebar.collapsed .op-nav-link.active {
      padding-left: 8px;
      box-shadow: none;
    }
    .op-sidebar.collapsed .op-side-foot {
      padding: 12px 6px;
    }
    .op-sidebar.collapsed .op-user-card {
      justify-content: center;
      padding: 9px 6px;
    }

    /* ── Navbar ──────────────────────────────────────────────────── */
    .op-navbar {
      height: 64px;
      background: rgba(30,68,65,0.96);
      backdrop-filter: blur(16px) saturate(150%);
      -webkit-backdrop-filter: blur(16px) saturate(150%);
      color: #fff;
      display: flex;
      align-items: center;
      padding: 0 24px 0 14px;
      gap: 10px;
      position: sticky;
      top: 0;
      z-index: 5;
      box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 20px -16px rgba(0,0,0,0.4);
    }

    /* Collapse button */
    .op-collapse-btn {
      display: grid;
      place-items: center;
      width: 34px; height: 34px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.09);
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.65);
      cursor: pointer;
      flex-shrink: 0;
      transition: background .15s;
    }
    .op-collapse-btn:hover {
      background: rgba(255,255,255,0.13);
      color: #fff;
    }

    /* Breadcrumbs */
    .op-crumbs {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      flex-shrink: 0;
    }
    .op-crumbs span:first-child { color: rgba(255,255,255,0.50); font-weight: 400; }
    .op-crumbs .here { color: #fff; font-weight: 600; letter-spacing: -0.01em; }

    /* Right side */
    .op-nav-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    .op-icon-btn {
      width: 38px; height: 38px;
      display: grid; place-items: center;
      border-radius: 10px;
      color: #fff;
      cursor: pointer;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.08);
      position: relative;
      transition: background .13s;
    }
    .op-icon-btn:hover { background: rgba(255,255,255,0.14); }
    .op-bell-badge {
      position: absolute;
      top: -5px; right: -5px;
      min-width: 18px; height: 18px;
      padding: 0 5px;
      background: #e74c3c;
      color: #fff;
      border-radius: 999px;
      font-size: 10.5px; font-weight: 700;
      display: grid; place-items: center;
      box-shadow: 0 0 0 2px rgba(42,100,97,1);
    }

    .op-avatar-chip {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 4px 12px 4px 4px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.10);
      cursor: pointer;
      color: #fff;
      transition: background .13s;
    }
    .op-avatar-chip:hover { background: rgba(255,255,255,0.16); }

    .op-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      font-size: 11px; font-weight: 700;
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
    }
    .op-chip-name { font-size: 12.5px; font-weight: 600; line-height: 1.1; }
    .op-chip-role { font-size: 10px; color: rgba(255,255,255,0.60); }

    /* ── Dropdown ───────────────────────────────────────────────── */
    @keyframes opDropIn {
      from { opacity:0; transform:translateY(-6px) scale(0.97); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    .op-user-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 14px;
      box-shadow: 0 8px 32px -8px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
      animation: opDropIn 0.18s cubic-bezier(0.4,0,0.2,1);
      z-index: 50;
    }
    .op-dd-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 15px;
      background: linear-gradient(180deg, rgba(58,143,139,0.06), transparent);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .op-dd-av {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      font-size: 12px; font-weight: 700;
      color: #fff; flex-shrink: 0;
    }
    .op-dd-name { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .op-dd-role { font-size: 11px; color: #888; }
    .op-dd-section { padding: 5px; }
    .op-dd-divider { height: 1px; background: rgba(0,0,0,0.06); }
    .op-dd-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      text-decoration: none;
      transition: background .12s;
    }
    .op-dd-item:hover { background: rgba(58,143,139,0.07); }
    .op-dd-icon {
      width: 30px; height: 30px;
      border-radius: 7px;
      background: rgba(58,143,139,0.09);
      border: 1px solid rgba(58,143,139,0.14);
      color: #2e7874;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .op-dd-label { font-size: 13px; font-weight: 600; color: #1a1a1a; }
    .op-dd-sub   { font-size: 11px; color: #888; margin-top: 1px; }
    .op-dd-item-danger:hover { background: rgba(192,57,43,0.06) !important; }
    .op-dd-icon-danger {
      background: rgba(192,57,43,0.08) !important;
      border-color: rgba(192,57,43,0.14) !important;
      color: #c0392b !important;
    }
    .op-dd-item-danger .op-dd-label { color: #c0392b !important; }

    /* ── Panel de notificaciones (campanita) ──────────────────────── */
    .op-notif-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 46px;
      width: 320px;
      max-width: calc(100vw - 24px);
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 14px;
      box-shadow: 0 8px 32px -8px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
      animation: opDropIn 0.18s cubic-bezier(0.4,0,0.2,1);
      z-index: 50;
    }
    .op-notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 15px;
      font-size: 13px; font-weight: 700; color: #1a1a1a;
      background: linear-gradient(180deg, rgba(58,143,139,0.06), transparent);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .op-notif-clear {
      font-size: 11.5px; font-weight: 600; color: #3a8f8b;
      background: none; border: none; cursor: pointer; padding: 2px 4px;
      font-family: inherit;
    }
    .op-notif-clear:hover { text-decoration: underline; }
    .op-notif-list { max-height: 360px; overflow-y: auto; padding: 5px; }
    .op-notif-empty {
      padding: 22px 14px;
      text-align: center;
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .op-notif-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: 100%;
      padding: 10px;
      border-radius: 9px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      position: relative;
      transition: background .12s;
    }
    .op-notif-item:hover { background: rgba(58,143,139,0.07); }
    .op-notif-item.unread { background: rgba(58,143,139,0.05); }
    .op-notif-icon {
      width: 30px; height: 30px;
      border-radius: 7px;
      background: rgba(58,143,139,0.09);
      border: 1px solid rgba(58,143,139,0.14);
      color: #2e7874;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .op-notif-icon.payment {
      background: rgba(124,58,237,0.09);
      border-color: rgba(124,58,237,0.16);
      color: #7c3aed;
    }
    .op-notif-body { min-width: 0; padding-right: 10px; }
    .op-notif-msg { font-size: 12.5px; font-weight: 600; color: #1a1a1a; line-height: 1.4; }
    .op-notif-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .op-notif-dot {
      position: absolute;
      top: 12px; right: 10px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #e74c3c;
      flex-shrink: 0;
    }
  `],
})
export class OperatorLayoutComponent implements OnInit, OnDestroy {
  private router          = inject(Router);
  private cd              = inject(ChangeDetectorRef);
  private operatorService = inject(OperatorService);

  readonly userName: string = getUserName() || 'Operario';
  currentUrl       = '';
  showUserMenu     = false;
  sidebarCollapsed = false;

  assignedCount = 0;

  // ── Aviso de "pedido enviado a cotización" (sonido + toast) ────────────────
  // Polling propio del layout (no solo del dashboard) para que el aviso llegue
  // sin importar en qué página del panel del operario esté trabajando.
  private readonly pollIntervalMs = 25000;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  // Se persiste en localStorage (no solo en memoria) para que, si el
  // operario recarga la página o vuelve más tarde, no se le vuelva a avisar
  // de un pedido que ya le fue anunciado antes; y para que si un pedido sale
  // de revisión y vuelve a entrar (el cliente lo reenvía tras un ajuste de
  // precio), sí se le avise de nuevo.
  private readonly notifiedOrdersStorageKey = 'operatorNotifiedQuotationOrders';
  private notifiedOrderIds: Set<string> = this.loadNotifiedOrderIds();
  // Igual que notifiedOrderIds, pero para comprobantes de pago pendientes de
  // revisión (el cliente subió su captura). Se guarda aparte porque un mismo
  // pedido puede pasar por ambos avisos en momentos distintos.
  private readonly notifiedPaymentsStorageKey = 'operatorNotifiedPendingPayments';
  private notifiedPaymentOrderIds: Set<string> = this.loadIdSet(this.notifiedPaymentsStorageKey);
  // Se crea una sola vez, en el primer clic/tecla del operario (ver
  // unlockAudioOnFirstInteraction más abajo): los navegadores bloquean el
  // audio creado fuera de una interacción real del usuario, y el polling
  // que dispara el aviso corre en segundo plano (setInterval), no en un
  // gesto del usuario.
  private audioCtx: AudioContext | null = null;

  notificationToasts: Array<{ id: string; orderId: string; message: string }> = [];

  // ── Historial de notificaciones (panel de la campanita) ──────────────────
  // Solo se registran avisos que el cliente origina: pedido enviado a
  // cotización o comprobante de pago subido. Se persiste para que el
  // operario pueda revisarlas aunque recargue la página.
  showNotificationsPanel = false;
  private readonly notificationHistoryStorageKey = 'operatorNotificationHistory';
  notificationHistory: NotificationHistoryItem[] = this.loadNotificationHistory();

  get unreadNotificationsCount(): number {
    return this.notificationHistory.filter((n) => !n.read).length;
  }

  get userInitials(): string {
    const p = this.userName.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'OP';
  }

  get pageTitle(): string {
    if (this.currentUrl.includes('/operator/dashboard')) return 'Mi cola de trabajo';
    if (this.currentUrl.includes('/operator/history'))   return 'Historial';
    if (this.currentUrl.includes('/operator/profile'))   return 'Mi perfil';
    if (this.currentUrl.includes('/operator/orders'))    return 'Detalle de pedido';
    return 'Operario';
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sidebarCollapsed = localStorage.getItem('opSidebarCollapsed') === 'true';
    }
    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
        this.cd.markForCheck();
      });

    // Badge de pedidos asignados + detección de nuevos envíos a cotización.
    this.refreshQueueState();
    this.pollHandle = setInterval(() => this.refreshQueueState(), this.pollIntervalMs);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  /**
   * Los navegadores solo permiten crear/activar audio a partir de una
   * interacción real del usuario (clic, tecla). Como el aviso de sonido lo
   * dispara un polling en segundo plano (sin gesto del usuario en ese
   * instante), se aprovecha el primer clic/tecla del operario en la página
   * para dejar el AudioContext ya creado y activo, listo para usarse más
   * tarde cuando llegue el aviso real.
   */
  @HostListener('document:click')
  @HostListener('document:keydown')
  unlockAudioOnFirstInteraction(): void {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.audioCtx = new AudioCtx();
    } catch {
      // Se reintenta en la próxima interacción.
    }
  }

  /**
   * Refresca el conteo de pedidos asignados y detecta pedidos en
   * OPERATOR_REVIEW_PENDING (el cliente los envió a cotización) que todavía
   * no se le avisaron a este operario, para mostrarle un sonido + aviso sin
   * que tenga que refrescar la página ni estar en "Mi cola de trabajo".
   * Se compara contra un registro persistido (no solo en memoria) para que
   * el aviso funcione aunque la página se haya recargado justo después de
   * que el cliente enviara el pedido.
   */
  private refreshQueueState(): void {
    this.operatorService.getAssignedOrders().subscribe({
      next: (res) => {
        const all: any[] = Array.isArray(res) ? res : (res?.data || []);
        this.assignedCount = all.filter((o: any) =>
          o.status === 'IN_PROGRESS' || o.status === 'PENDING'
        ).length;

        let changed = false;
        let paymentsChanged = false;
        for (const order of all) {
          if (order.status === 'OPERATOR_REVIEW_PENDING') {
            if (!this.notifiedOrderIds.has(order.id)) {
              this.announceNewQuotationRequest(order);
              this.notifiedOrderIds.add(order.id);
              changed = true;
            }
          } else if (this.notifiedOrderIds.delete(order.id)) {
            // Si salió de revisión (aprobado, ajustado, cancelado, etc.) se
            // libera: si el cliente vuelve a enviarlo más adelante, avisa de nuevo.
            changed = true;
          }

          if (order.has_pending_payment) {
            if (!this.notifiedPaymentOrderIds.has(order.id)) {
              this.announceNewPayment(order);
              this.notifiedPaymentOrderIds.add(order.id);
              paymentsChanged = true;
            }
          } else if (this.notifiedPaymentOrderIds.delete(order.id)) {
            // El comprobante ya se revisó (aprobado/rechazado): si el cliente
            // sube uno nuevo más adelante, avisa de nuevo.
            paymentsChanged = true;
          }
        }
        if (changed) this.saveNotifiedOrderIds();
        if (paymentsChanged) this.saveIdSet(this.notifiedPaymentsStorageKey, this.notifiedPaymentOrderIds);

        this.cd.markForCheck();
      },
      // Silencioso: un fallo de esta actualización en segundo plano no debe
      // interrumpir el trabajo del operario ni el resto del polling.
      error: () => {},
    });
  }

  private loadNotifiedOrderIds(): Set<string> {
    return this.loadIdSet(this.notifiedOrdersStorageKey);
  }

  private saveNotifiedOrderIds(): void {
    this.saveIdSet(this.notifiedOrdersStorageKey, this.notifiedOrderIds);
  }

  private loadIdSet(key: string): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(key);
      const ids = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(ids) ? ids : []);
    } catch {
      return new Set();
    }
  }

  private saveIdSet(key: string, set: Set<string>): void {
    if (typeof window === 'undefined') return;
    try {
      // Se limita el historial guardado para que no crezca sin control.
      const ids = Array.from(set).slice(-300);
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // Si falla (almacenamiento lleno, modo privado, etc.), simplemente no persiste.
    }
  }

  private announceNewQuotationRequest(order: any): void {
    const clientName = this.getOrderClientName(order);
    const message = `${clientName} te envió un pedido a cotizar`;

    this.pushToast(order.id, message);
    this.pushNotification(order.id, 'quotation', message);
    this.playNotificationChime();
  }

  private announceNewPayment(order: any): void {
    const clientName = this.getOrderClientName(order);
    const message = `${clientName} envió un comprobante de pago para revisar`;

    this.pushToast(order.id, message);
    this.pushNotification(order.id, 'payment', message);
    this.playNotificationChime();
  }

  private getOrderClientName(order: any): string {
    const firstName = order?.client?.first_name ?? '';
    const lastName = order?.client?.last_name ?? '';
    return `${firstName} ${lastName}`.trim() || 'Un cliente';
  }

  // ── Historial de notificaciones (panel de la campanita) ──────────────────

  toggleNotificationsPanel(): void {
    this.showNotificationsPanel = !this.showNotificationsPanel;
  }

  closeNotificationsPanel(): void {
    this.showNotificationsPanel = false;
  }

  openNotification(item: NotificationHistoryItem): void {
    item.read = true;
    this.saveNotificationHistory();
    this.showNotificationsPanel = false;
    this.router.navigate(['/operator/orders', item.orderId]);
  }

  clearNotificationHistory(): void {
    this.notificationHistory = [];
    this.saveNotificationHistory();
  }

  formatNotificationTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  }

  private pushNotification(orderId: string, type: 'quotation' | 'payment', message: string): void {
    const item: NotificationHistoryItem = {
      id: `${orderId}-${type}-${Date.now()}`,
      orderId,
      type,
      message,
      createdAt: Date.now(),
      read: false,
    };
    // Más reciente primero; se limita a 50 para no crecer sin control.
    this.notificationHistory = [item, ...this.notificationHistory].slice(0, 50);
    this.saveNotificationHistory();
  }

  private loadNotificationHistory(): NotificationHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.notificationHistoryStorageKey);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  private saveNotificationHistory(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.notificationHistoryStorageKey, JSON.stringify(this.notificationHistory));
    } catch {
      // Si falla (almacenamiento lleno, modo privado, etc.), simplemente no persiste.
    }
  }

  private pushToast(orderId: string, message: string): void {
    const id = `${orderId}-${Date.now()}`;
    this.notificationToasts = [...this.notificationToasts, { id, orderId, message }];
    this.cd.markForCheck();
    setTimeout(() => this.dismissToast(id), 8000);
  }

  dismissToast(id: string): void {
    this.notificationToasts = this.notificationToasts.filter((t) => t.id !== id);
    this.cd.markForCheck();
  }

  goToToastOrder(orderId: string): void {
    this.notificationToasts = this.notificationToasts.filter((t) => t.orderId !== orderId);
    this.router.navigate(['/operator/orders', orderId]);
  }

  /** Campanita de dos tonos generada con Web Audio API (sin archivo de audio). */
  private playNotificationChime(): void {
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioCtx) {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.audioCtx = new AudioCtx();
      }

      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        // Puede seguir sonando aunque falle este resume puntual (si el
        // contexto ya se activó antes con un clic/tecla real).
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const notes = [880, 1174.66]; // La5 -> Re6: campanita corta y agradable

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const start = now + i * 0.13;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.28, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {
      // Si el navegador bloquea audio (sin interacción previa, etc.), se
      // omite el sonido; el aviso visual (toast) igual se muestra.
    }
  }

  isActive(path: string): boolean {
    return this.currentUrl === path
      || this.currentUrl.startsWith(path + '/')
      || this.currentUrl.startsWith(path + '?');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('opSidebarCollapsed', String(this.sidebarCollapsed));
    }
  }

  toggleUserMenu(): void { this.showUserMenu = !this.showUserMenu; }
  closeUserMenu():  void { this.showUserMenu = false; }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.showUserMenu = false; }

  logout(): void {
    this.showUserMenu = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }
}
