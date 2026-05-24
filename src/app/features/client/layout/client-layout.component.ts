import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef, OnInit, ViewEncapsulation } from '@angular/core';
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
    @keyframes pageSlideIn {
      from { opacity: 0; transform: translateY(7px); }
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
      animation: pageSlideIn 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `],
})
export class ClientLayoutComponent implements OnInit {
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  readonly userName: string = getUserName() || 'Usuario';
  currentUrl = '';
  sidebarCollapsed = false;

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

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }
}
