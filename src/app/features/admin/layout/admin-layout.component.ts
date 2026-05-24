import {
  Component, inject, OnInit, ChangeDetectorRef,
  HostListener, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { getUserName } from '../../../core/utils/jwt.utils';
import { AdminStatsService } from '../dashboard/admin-stats.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    /* ── Animación de entrada ────────────────────────────────── */
    @keyframes adminPageIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    app-admin-dashboard,
    app-admin-orders,
    app-admin-payments,
    app-admin-users,
    app-services-admin,
    app-materials-admin,
    app-admin-reports {
      display: block;
      animation: adminPageIn 0.18s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Shell grid ──────────────────────────────────────────── */
    .admin-shell {
      display: grid;
      grid-template-columns: 200px 1fr;
      min-height: 100vh;
      position: relative;
      z-index: 1;
      transition: grid-template-columns .22s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Sidebar ─────────────────────────────────────────────── */
    .admin-sidebar {
      background: rgba(30,75,72,0.94);
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
    }

    .admin-brand {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 18px;
      height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .admin-brand-mark {
      width: 30px; height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid;
      place-items: center;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset, 0 4px 14px -4px rgba(58,143,139,0.5);
      flex-shrink: 0;
    }
    .admin-brand-name {
      font-weight: 600;
      letter-spacing: -0.01em;
      font-size: 14px;
      color: #fff;
      line-height: 1.2;
    }
    .admin-brand-sub {
      font-size: 10.5px;
      color: rgba(255,255,255,0.50);
      margin-top: 1px;
    }

    .admin-nav-label {
      font-size: 10px;
      letter-spacing: 0.10em;
      color: rgba(255,255,255,0.40);
      text-transform: uppercase;
      padding: 18px 18px 6px;
      font-weight: 600;
    }
    .admin-nav {
      display: flex;
      flex-direction: column;
      padding: 0 8px;
      gap: 2px;
    }
    .admin-nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      color: rgba(255,255,255,0.70);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      border-left: 3px solid transparent;
      transition: background .14s, color .14s;
    }
    .admin-nav-link:hover {
      background: rgba(255,255,255,0.06);
      color: #fff;
    }
    .admin-nav-link.active {
      background: rgba(58,143,139,0.22);
      color: #fff;
      border-left-color: #3a8f8b;
      border-radius: 0 8px 8px 0;
      padding-left: 14px;
      font-weight: 600;
    }
    .admin-nav-icon {
      width: 16px; height: 16px;
      flex-shrink: 0;
      opacity: .85;
    }
    .admin-nav-badge {
      margin-left: auto;
      font-size: 11px;
      background: rgba(255,255,255,0.12);
      color: #fff;
      padding: 1px 7px;
      border-radius: 999px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1.6;
    }
    .admin-nav-link.active .admin-nav-badge {
      background: #3a8f8b;
    }
    .admin-nav-badge.warn {
      background: #d4a04a;
      color: #fff;
    }

    /* ── Sidebar footer ──────────────────────────────────────── */
    .admin-side-foot {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    .admin-health-card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 10px;
      padding: 11px 12px;
      margin-bottom: 10px;
    }
    .admin-health-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: rgba(255,255,255,0.70);
      margin-bottom: 5px;
    }
    .admin-health-row:last-child { margin-bottom: 0; }
    .admin-health-val {
      color: #fff;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    .admin-health-val.ok { color: #a7e3da; }
    .admin-health-dot {
      display: inline-block;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #48bb78;
      box-shadow: 0 0 0 3px rgba(72,187,120,0.20);
      margin-right: 5px;
      vertical-align: middle;
    }

    .admin-op-card {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 10px;
      border-radius: 9px;
      background: rgba(255,255,255,0.05);
    }
    .admin-op-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.20);
      flex-shrink: 0;
    }
    .admin-op-name {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      line-height: 1.2;
    }
    .admin-op-role {
      font-size: 10px;
      color: rgba(255,255,255,0.50);
    }

    /* ── Header ──────────────────────────────────────────────── */
    .admin-navbar {
      height: 64px;
      background: rgba(42,100,97,0.96);
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

    .admin-crumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(255,255,255,0.65);
      flex-shrink: 0;
    }
    .admin-crumbs .sep { color: rgba(255,255,255,0.35); }
    .admin-crumbs .here { color: #fff; font-weight: 600; }

    .admin-nav-right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    .admin-icon-btn {
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
    .admin-icon-btn:hover { background: rgba(255,255,255,0.14); }

    .admin-avatar-chip {
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
    .admin-avatar-chip:hover { background: rgba(255,255,255,0.16); }

    .admin-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      font-size: 11px; font-weight: 700;
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
    }
    .admin-chip-name { font-size: 12.5px; font-weight: 600; line-height: 1.1; }
    .admin-chip-role { font-size: 10px; color: rgba(255,255,255,0.60); }
    .admin-chip-chevron {
      transition: transform .16s;
      opacity: .7;
    }

    /* ── User dropdown ───────────────────────────────────────── */
    @keyframes adminDropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    .admin-user-dropdown {
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
      animation: adminDropIn 0.18s cubic-bezier(0.4,0,0.2,1);
      z-index: 50;
    }
    .admin-dd-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 15px;
      background: linear-gradient(180deg, rgba(58,143,139,0.06), transparent);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .admin-dd-av {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      font-size: 12px; font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .admin-dd-name { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .admin-dd-role { font-size: 11px; color: #888; }
    .admin-dd-section { padding: 5px; }
    .admin-dd-divider { height: 1px; background: rgba(0,0,0,0.06); }
    .admin-dd-item {
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
      font-family: 'Inter', sans-serif;
      transition: background .12s;
    }
    .admin-dd-item:hover { background: rgba(58,143,139,0.07); }
    .admin-dd-icon {
      width: 30px; height: 30px;
      border-radius: 7px;
      background: rgba(58,143,139,0.09);
      border: 1px solid rgba(58,143,139,0.14);
      color: #2e7874;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .admin-dd-label { font-size: 13px; font-weight: 600; color: #1a1a1a; }
    .admin-dd-sub   { font-size: 11px; color: #888; margin-top: 1px; }
    .admin-dd-item-danger:hover { background: rgba(192,57,43,0.06) !important; }
    .admin-dd-icon-danger {
      background: rgba(192,57,43,0.08) !important;
      border-color: rgba(192,57,43,0.14) !important;
      color: #c0392b !important;
    }
    .admin-dd-item-danger .admin-dd-label { color: #c0392b !important; }

    /* ── Page shell (orders, users, services, materials) ─────── */
    .admin-page-shell {
      padding: 28px 36px 56px;
      max-width: 1280px;
      width: 100%;
      box-sizing: border-box;
      overflow-y: auto;
    }

    /* ── Collapse button (in header) ────────────────────────── */
    .admin-collapse-btn {
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
    .admin-collapse-btn:hover {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }

    /* ── Collapsed sidebar ───────────────────────────────────── */
    .admin-shell.collapsed {
      grid-template-columns: 62px 1fr;
    }
    .admin-sidebar.collapsed {
      align-items: center;
    }
    .admin-sidebar.collapsed .admin-brand {
      justify-content: center;
      padding: 18px 10px;
    }
    .admin-sidebar.collapsed .admin-brand-name,
    .admin-sidebar.collapsed .admin-brand-sub {
      display: none;
    }
    .admin-sidebar.collapsed .admin-nav {
      padding: 0 4px;
    }
    .admin-sidebar.collapsed .admin-nav-link {
      justify-content: center;
      padding: 9px 8px;
    }
    .admin-sidebar.collapsed .admin-nav-link.active {
      padding-left: 8px;
    }
    .admin-sidebar.collapsed .admin-nav-text,
    .admin-sidebar.collapsed .admin-nav-badge {
      display: none;
    }
    .admin-sidebar.collapsed .admin-op-card {
      justify-content: center;
      padding: 9px 6px;
    }
    .admin-sidebar.collapsed .admin-op-name,
    .admin-sidebar.collapsed .admin-op-role {
      display: none;
    }
    .admin-sidebar.collapsed .admin-side-foot {
      padding: 12px 6px;
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  private router       = inject(Router);
  private cd           = inject(ChangeDetectorRef);
  private statsService = inject(AdminStatsService);

  readonly userName: string = getUserName() || 'Administrador';
  currentUrl       = '';
  showUserMenu     = false;
  sidebarCollapsed = false;

  // Badge counts (loaded from API)
  activeOrdersCount    = 0;
  pendingPaymentsCount = 0;

  get userInitials(): string {
    const p = this.userName.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'AD';
  }

  get pageTitle(): string {
    if (this.currentUrl.includes('/admin/orders'))   return 'Pedidos';
    if (this.currentUrl.includes('/admin/payments')) return 'Pagos pendientes';
    if (this.currentUrl.includes('/admin/users'))    return 'Usuarios';
    if (this.currentUrl.includes('/admin/services')) return 'Servicios';
    if (this.currentUrl.includes('/admin/materials'))return 'Materiales';
    if (this.currentUrl.includes('/admin/reports'))  return 'Reportes';
    return 'Dashboard';
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sidebarCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
    }
    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
        this.cd.detectChanges();
      });

    // Load sidebar badge counts
    this.statsService.getOrdersByStatus().subscribe({
      next: (statusMap) => {
        this.pendingPaymentsCount = statusMap.get('PENDING_PAYMENT') ?? 0;
        this.activeOrdersCount =
          (statusMap.get('BUDGETED')         ?? 0) +
          (statusMap.get('PENDING_PAYMENT')  ?? 0) +
          (statusMap.get('IN_PROGRESS')      ?? 0) +
          (statusMap.get('READY')            ?? 0);
        this.cd.markForCheck();
      },
    });
  }

  isActive(path: string): boolean {
    return this.currentUrl === path || this.currentUrl.startsWith(path + '/') || this.currentUrl.startsWith(path + '?');
  }

  toggleUserMenu(): void { this.showUserMenu = !this.showUserMenu; }
  closeUserMenu():  void { this.showUserMenu = false; }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSidebarCollapsed', String(this.sidebarCollapsed));
    }
  }

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
