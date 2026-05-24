import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { getUserName } from '../../../core/utils/jwt.utils';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './client-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    /* ── Animación de entrada de páginas ────────────────────── */
    @keyframes pageSlideIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    app-client-dashboard,
    app-new-order,
    app-my-orders,
    app-order-detail,
    app-client-payment,
    app-client-payments-list,
    app-client-notifications {
      display: block;
      animation: pageSlideIn 0.20s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Nav links ───────────────────────────────────────────── */
    .nav-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      border-radius: 8px;
      color: rgba(255,255,255,0.60);
      font-size: 13px;
      font-weight: 450;
      font-family: 'Inter', sans-serif;
      letter-spacing: -0.005em;
      transition: background 0.13s, color 0.13s;
    }
    .nav-link:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.90);
    }
    .nav-link-active {
      background: rgba(58,143,139,0.28) !important;
      color: #fff !important;
      font-weight: 600 !important;
      box-shadow: inset 2px 0 0 #3a8f8b;
    }
    .nav-icon {
      width: 16px; height: 16px;
      flex-shrink: 0;
    }
    .nav-label {
      white-space: nowrap;
      overflow: hidden;
    }

    /* ── User dropdown ───────────────────────────────────────── */
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    .user-dropdown {
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 14px;
      box-shadow: 0 8px 32px -8px rgba(0,0,0,0.22),
                  0 2px 8px rgba(0,0,0,0.06),
                  0 0 0 1px rgba(255,255,255,0.6) inset;
      overflow: hidden;
      animation: dropIn 0.18s cubic-bezier(0.4,0,0.2,1);
    }
    .user-dropdown-header {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 14px 16px;
      background: linear-gradient(180deg, rgba(58,143,139,0.06), transparent);
    }
    .dropdown-divider {
      height: 1px;
      background: rgba(0,0,0,0.06);
      margin: 0;
    }
    .dropdown-section {
      padding: 5px;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 9px 11px;
      border-radius: 9px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-family: 'Inter', sans-serif;
      transition: background 0.12s;
    }
    .dropdown-item:hover {
      background: rgba(58,143,139,0.07);
    }
    .dropdown-item-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: rgba(58,143,139,0.09);
      border: 1px solid rgba(58,143,139,0.14);
      color: #2e7874;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .dropdown-item-label {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      letter-spacing: -0.01em;
      line-height: 1.3;
    }
    .dropdown-item-sub {
      font-size: 11px;
      color: #888;
      margin-top: 1px;
      font-weight: 400;
    }

    /* Danger (cerrar sesión) */
    .dropdown-item-danger:hover {
      background: rgba(192,57,43,0.06) !important;
    }
    .dropdown-item-icon-danger {
      background: rgba(192,57,43,0.08) !important;
      border-color: rgba(192,57,43,0.14) !important;
      color: #c0392b !important;
    }
    .dropdown-item-danger .dropdown-item-label {
      color: #c0392b !important;
    }
    .dropdown-item-danger .dropdown-item-sub {
      color: #e08070 !important;
    }
  `],
})
export class ClientLayoutComponent implements OnInit {
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  readonly userName: string = getUserName() || 'Usuario';
  currentUrl = '';
  sidebarCollapsed = false;
  showUserMenu = false;

  get userInitials(): string {
    const parts = this.userName.trim().split(/\s+/);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? '').toUpperCase();
    return a + b;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    }
    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl = (e as NavigationEnd).urlAfterRedirects;
        this.cd.detectChanges();
      });
  }

  get pageTitle(): string {
    if (this.currentUrl.includes('/orders/new')) return 'Nuevo pedido';
    if (/\/orders\/.+\/payment/.test(this.currentUrl)) return 'Realizar pago';
    if (/\/orders\/.+/.test(this.currentUrl)) return 'Detalle del pedido';
    if (this.currentUrl.includes('/orders')) return 'Mis pedidos';
    if (this.currentUrl.includes('/payments')) return 'Pagos';
    if (this.currentUrl.includes('/notifications')) return 'Notificaciones';
    return 'Inicio';
  }

  isActive(path: string): boolean {
    return this.currentUrl === path || this.currentUrl.startsWith(path + '?');
  }

  isOrdersActive(): boolean {
    return (
      this.currentUrl.startsWith('/client/orders') &&
      !this.currentUrl.includes('/orders/new') &&
      !this.currentUrl.includes('/payment')
    );
  }

  isPaymentsActive(): boolean {
    return (
      this.currentUrl.startsWith('/client/payments') ||
      /\/orders\/.+\/payment/.test(this.currentUrl)
    );
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  /** Cierra el menú al hacer clic fuera de él */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.showUserMenu = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }
}
