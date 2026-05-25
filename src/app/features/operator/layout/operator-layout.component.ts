import {
  Component, inject, OnInit, ChangeDetectorRef,
  HostListener, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { getUserName } from '../../../core/utils/jwt.utils';
import { OperatorService } from '../operator.service';

@Component({
  selector: 'app-operator-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="op-shell" [class.collapsed]="sidebarCollapsed">

  <!-- ============ SIDEBAR ============ -->
  <aside class="op-sidebar" [class.collapsed]="sidebarCollapsed">

    <!-- Brand -->
    <div class="op-brand">
      <div class="op-brand-mark">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2z" fill="white" fill-opacity=".95"/>
          <path d="M8 8h4v4H8z" fill="white" fill-opacity=".55"/>
        </svg>
      </div>
      <div class="op-brand-text">
        <div class="op-brand-name">SIGEPED</div>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             [style.transform]="sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'"
             style="transition:transform .22s ease;">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <!-- Breadcrumbs -->
      <div class="op-crumbs">
        <span>Operario</span>
        <span class="sep">›</span>
        <span class="here">{{ pageTitle }}</span>
      </div>

      <div class="op-nav-right">

        <!-- Notifications -->
        <button class="op-icon-btn" title="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>
            <path d="M10 21a2 2 0 0 0 4 0"/>
          </svg>
          <span *ngIf="assignedCount > 0" class="op-bell-badge">{{ assignedCount }}</span>
        </button>

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
      background:
        radial-gradient(1100px 700px at 90% -10%, rgba(200,216,214,0.55), transparent 60%),
        radial-gradient(900px 600px at -5% 110%, rgba(168,192,190,0.40), transparent 60%),
        linear-gradient(160deg,#b8c4c2 0%,#8fa8a5 35%,#6b8f8c 70%,#4a6f6d 100%);
      background-attachment: fixed;
      min-height: 100vh;
    }
    body::before {
      content:""; position:fixed; border-radius:50%; pointer-events:none;
      filter:blur(80px); opacity:.45; z-index:0;
      width:360px; height:360px; background:#c8d8d6; top:-100px; right:-80px;
    }
    body::after {
      content:""; position:fixed; border-radius:50%; pointer-events:none;
      filter:blur(80px); opacity:.30; z-index:0;
      width:420px; height:420px; background:#3d8c89; bottom:-140px; left:-120px;
    }

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
      background: rgba(30,75,72,0.92);
      backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%);
      color: #e6f0ee;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      box-shadow: inset -1px 0 0 rgba(255,255,255,0.05);
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
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .op-brand-mark {
      width: 30px; height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset, 0 4px 14px -4px rgba(58,143,139,0.5);
      flex-shrink: 0;
    }
    .op-brand-name {
      font-weight: 600;
      letter-spacing: -0.01em;
      font-size: 15px;
      color: #fff;
    }
    .op-brand-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
      margin-top: 1px;
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
      gap: 11px;
      padding: 10px 12px;
      border-radius: 8px;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      border-left: 3px solid transparent;
      transition: background .14s, color .14s;
      white-space: nowrap;
      overflow: hidden;
    }
    .op-nav-link:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .op-nav-link.active {
      background: rgba(58,143,139,0.22);
      color: #fff;
      border-left-color: #3a8f8b;
      border-radius: 0 8px 8px 0;
      padding-left: 14px;
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
      border-top: 1px solid rgba(255,255,255,0.08);
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
      padding: 10px 8px;
    }
    .op-sidebar.collapsed .op-nav-link.active {
      padding-left: 8px;
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
      background: rgba(42,100,97,0.95);
      backdrop-filter: blur(16px) saturate(140%);
      -webkit-backdrop-filter: blur(16px) saturate(140%);
      color: #fff;
      display: flex;
      align-items: center;
      padding: 0 28px;
      gap: 20px;
      position: sticky;
      top: 0;
      z-index: 5;
      box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 20px -16px rgba(0,0,0,0.4);
    }

    /* Collapse button */
    .op-collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px; height: 36px;
      border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.75);
      cursor: pointer;
      flex-shrink: 0;
      transition: background .13s, color .13s;
    }
    .op-collapse-btn:hover {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }

    /* Breadcrumbs */
    .op-crumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(255,255,255,0.65);
      flex-shrink: 0;
    }
    .op-crumbs .sep { color: rgba(255,255,255,0.35); }
    .op-crumbs .here { color: #fff; font-weight: 600; }

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
  `],
})
export class OperatorLayoutComponent implements OnInit {
  private router          = inject(Router);
  private cd              = inject(ChangeDetectorRef);
  private operatorService = inject(OperatorService);

  readonly userName: string = getUserName() || 'Operario';
  currentUrl       = '';
  showUserMenu     = false;
  sidebarCollapsed = false;

  assignedCount = 0;

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
        this.cd.detectChanges();
      });

    // Badge: pedidos asignados activos
    this.operatorService.getAssignedOrders().subscribe({
      next: (res) => {
        const all = Array.isArray(res) ? res : (res?.data || []);
        this.assignedCount = all.filter((o: any) =>
          o.status === 'IN_PROGRESS' || o.status === 'PENDING'
        ).length;
        this.cd.markForCheck();
      },
    });
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
