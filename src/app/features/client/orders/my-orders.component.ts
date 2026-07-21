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
        this.cd.markForCheck();
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading = false;
        this.error = error.error?.message ?? 'No se pudieron cargar tus pedidos.';
        this.cd.markForCheck();
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
      case 'DRAFT':
        return { label: 'Borrador', classes: 'border-slate-300 bg-slate-50 text-slate-600' };
      case 'BUDGETED':
        return { label: 'Pedido creado', classes: 'border-amber-300 bg-amber-50 text-amber-700' };
      case 'CLIENT_REVIEW_PENDING':
        return { label: 'Revisión del cliente pendiente', classes: 'border-orange-300 bg-orange-50 text-orange-700' };
      case 'OPERATOR_REVIEW_PENDING':
        return { label: 'En revisión del operario', classes: 'border-indigo-300 bg-indigo-50 text-indigo-700' };
      case 'PENDING_PAYMENT':
        return { label: 'Pendiente de pago', classes: 'border-purple-300 bg-purple-50 text-purple-700' };
      case 'IN_PROGRESS':
        return { label: 'En producción', classes: 'border-blue-300 bg-blue-50 text-blue-700' };
      case 'READY':
        return { label: 'Listo para recoger', classes: 'border-green-300 bg-green-50 text-green-700' };
      case 'DELIVERED':
        return { label: 'Entregado', classes: 'border-teal-300 bg-teal-50 text-teal-700' };
      case 'CANCELLED':
        return { label: 'Cancelado', classes: 'border-red-300 bg-red-50 text-red-700' };
      case 'EXPIRED':
        return { label: 'Presupuesto vencido', classes: 'border-gray-300 bg-gray-100 text-gray-500' };
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

  /**
   * El operario recién define un precio real durante/al salir de su revisión
   * (OPERATOR_REVIEW_PENDING). Antes de eso (DRAFT, BUDGETED o mientras está
   * en revisión) el "presupuesto" es un placeholder en S/ 0.00, así que no
   * debe mostrarse todavía en la lista de pedidos.
   */
  hasOperatorPricing(order: ClientOrder): boolean {
    const s = order?.status;
    return !!s && s !== 'DRAFT' && s !== 'BUDGETED' && s !== 'OPERATOR_REVIEW_PENDING';
  }
}
