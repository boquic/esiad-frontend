import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { getUserName } from '../../../core/utils/jwt.utils';
import { ClientOrder, ClientOrdersService, OrderStatus } from './orders.service';

type OrderStatusMeta = {
  label: string;
  classes: string;
};

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './my-orders.component.html',
})
export class MyOrdersComponent {
  private ordersService = inject(ClientOrdersService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  orders: ClientOrder[] = [];
  loading = false;
  error = '';

  // ── User ────────────────────────────────────────────────────────────────
  readonly userName: string = getUserName() || 'Usuario';

  get userInitials(): string {
    const parts = this.userName.trim().split(/\s+/);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? '').toUpperCase();
    return a + b;
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '?');
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';

    this.ordersService.getMyOrders().subscribe({
      next: (response) => {
        this.orders = this.ordersService.unwrapCollection(response);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading = false;
        this.error = error.error?.message ?? 'No se pudieron cargar tus pedidos.';
        this.cd.detectChanges();
      },
    });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }

  getStatusMeta(status: string): OrderStatusMeta {
    const normalizedStatus = String(status).trim().toUpperCase() as OrderStatus;

    switch (normalizedStatus) {
      case 'BUDGETED':
        return { label: 'Presupuestado', classes: 'border-amber-300 bg-amber-50 text-amber-700' };
      case 'PENDING_PAYMENT':
        return { label: 'Pendiente de pago', classes: 'border-purple-300 bg-purple-50 text-purple-700' };
      case 'IN_PROGRESS':
        return { label: 'En proceso', classes: 'border-blue-300 bg-blue-50 text-blue-700' };
      case 'READY':
        return { label: 'Listo para recoger', classes: 'border-green-300 bg-green-50 text-green-700' };
      case 'DELIVERED':
        return { label: 'Entregado', classes: 'border-teal-300 bg-teal-50 text-teal-700' };
      case 'CANCELLED':
        return { label: 'Cancelado', classes: 'border-red-300 bg-red-50 text-red-700' };
      case 'EXPIRED':
        return { label: 'Expirado', classes: 'border-gray-300 bg-gray-100 text-gray-500' };
      default:
        return { label: normalizedStatus || 'Desconocido', classes: 'border-gray-300 bg-gray-100 text-gray-500' };
    }
  }

  getServiceName(order: ClientOrder): string {
    return order.service_type?.name ?? order.serviceType?.name ?? 'Servicio sin nombre';
  }

  getMaterialName(order: ClientOrder): string {
    return order.material?.name ?? 'Material no especificado';
  }

  getEstimatedPrice(order: ClientOrder): number {
    return this.ordersService.getOrderEstimatedPrice(order);
  }
}
