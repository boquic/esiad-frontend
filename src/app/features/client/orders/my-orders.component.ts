import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ClientOrder, ClientOrdersService, OrderStatus } from './orders.service';

type OrderStatusMeta = {
  label: string;
  classes: string;
};

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './my-orders.component.html',
})
export class MyOrdersComponent {
  private ordersService = inject(ClientOrdersService);
  private router = inject(Router);

  orders: ClientOrder[] = [];
  loading = false;
  error = '';

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
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading = false;
        this.error = error.error?.message ?? 'No se pudieron cargar tus pedidos.';
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
        return {
          label: 'Presupuestado',
          classes: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
        };
      case 'PENDING_PAYMENT':
        return {
          label: 'Pendiente de pago',
          classes: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
        };
      case 'IN_PROGRESS':
        return {
          label: 'En proceso',
          classes: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
        };
      case 'READY':
        return {
          label: 'Listo para recoger',
          classes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
        };
      case 'DELIVERED':
        return {
          label: 'Entregado',
          classes: 'border-teal-400/30 bg-teal-400/10 text-teal-200',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelado',
          classes: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
        };
      case 'EXPIRED':
        return {
          label: 'Expirado',
          classes: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
        };
      default:
        return {
          label: normalizedStatus || 'Desconocido',
          classes: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
        };
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
