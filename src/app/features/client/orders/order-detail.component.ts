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
