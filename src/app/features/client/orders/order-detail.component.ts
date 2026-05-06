import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ClientOrderDetail,
  ClientOrdersService,
  OrderFile,
  OrderPayment,
  OrderStatus,
} from './orders.service';

type OrderStatusMeta = {
  label: string;
  classes: string;
};

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(ClientOrdersService);

  order: ClientOrderDetail | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.error = 'No se encontro el pedido solicitado.';
      return;
    }

    this.loadOrder(orderId);
  }

  loadOrder(orderId: string): void {
    this.loading = true;
    this.error = '';

    this.ordersService.getOrderById(orderId).subscribe({
      next: (response) => {
        this.order = this.ordersService.unwrapResource(response);
        this.loading = false;

        if (!this.order) {
          this.error = 'No se encontro el detalle del pedido.';
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading = false;
        this.error = error.error?.message ?? 'No se pudo cargar el detalle del pedido.';
      },
    });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }

  getStatusMeta(status: string | null | undefined): OrderStatusMeta {
    const normalizedStatus = String(status ?? '').trim().toUpperCase() as OrderStatus;

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

  getServiceName(): string {
    return this.order?.service_type?.name ?? this.order?.serviceType?.name ?? 'Servicio sin nombre';
  }

  getMaterialName(): string {
    return this.order?.material?.name ?? 'Material no especificado';
  }

  getEstimatedPrice(): number {
    return this.ordersService.getOrderEstimatedPrice(this.order);
  }

  getOrderFiles(): OrderFile[] {
    return this.ordersService.getOrderFiles(this.order);
  }

  getOrderPayments(): OrderPayment[] {
    return this.ordersService.getOrderPayments(this.order);
  }

  getPaymentAmount(payment: OrderPayment): number {
    return this.ordersService.getPaymentAmount(payment);
  }

  getFileUrl(file: OrderFile): string {
    return this.ordersService.getFileUrl(file);
  }

  getFileType(file: OrderFile): string {
    return this.ordersService.getFileType(file);
  }
}
