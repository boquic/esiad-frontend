import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getUserName } from '../../../core/utils/jwt.utils';
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
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(ClientOrdersService);
  private cd = inject(ChangeDetectorRef);

  order: ClientOrderDetail | null = null;
  loading = false;
  error = '';

  // Pickup
  confirmingPickup = false;
  showPickupModal = false;
  pickupSuccessMessage = '';
  downloadingFileId: string | null = null;

  // Confirm review (BUDGETED / CLIENT_REVIEW_PENDING)
  confirmingReview = false;
  confirmReviewNotes = '';
  showConfirmReviewModal = false;

  // Send observation
  submittingObservation = false;
  observationText = '';
  observationError = '';
  observationSuccess = '';

  // Generic success message
  actionSuccessMessage = '';

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
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.error = 'No se encontro el pedido solicitado.';
      return;
    }
    this.loadOrder(orderId);
  }

  loadOrder(orderId: string, silent = false): void {
    if (!silent) this.loading = true;
    this.error = '';
    this.ordersService.getOrderById(orderId).subscribe({
      next: (response) => {
        this.order = this.ordersService.unwrapResource(response);
        if (!silent) this.loading = false;
        if (!this.order) {
          this.error = 'No se encontro el detalle del pedido.';
        }
        this.cd.detectChanges();
      },
      error: (error: { error?: { message?: string } }) => {
        if (!silent) this.loading = false;
        this.error = error.error?.message ?? 'No se pudo cargar el detalle del pedido.';
        this.cd.detectChanges();
      },
    });
  }

  openPickupModal(): void {
    if (this.order?.status !== 'READY') return;
    this.showPickupModal = true;
  }

  closePickupModal(): void {
    if (!this.confirmingPickup) {
      this.showPickupModal = false;
    }
  }

  confirmPickup(): void {
    if (!this.order || this.order.status !== 'READY') return;
    
    this.confirmingPickup = true;
    this.error = '';
    this.pickupSuccessMessage = '';
    
    console.log('pickup_confirm_attempt', { orderId: this.order.id });

    this.ordersService.confirmPickup(this.order.id).subscribe({
      next: (response) => {
        console.log('pickup_confirm_success', { orderId: this.order?.id });
        this.confirmingPickup = false;
        this.showPickupModal = false;
        
        if (this.order) {
          this.pickupSuccessMessage = 'Pedido entregado';
          this.loadOrder(this.order.id, true);
        } else {
          this.cd.detectChanges();
        }
      },
      error: (error: any) => {
        console.log('pickup_confirm_fail', { orderId: this.order?.id, error });
        this.confirmingPickup = false;
        this.showPickupModal = false;

        if (error.status === 401 || error.status === 403) {
            this.router.navigate(['/login']);
            return;
        }

        if (error.status === 404) {
            this.error = 'Pedido no encontrado';
        } else {
            this.error = error.error?.message ?? 'No se puede confirmar la recogida: estado inválido';
        }
        
        if (this.order) {
            this.loadOrder(this.order.id);
        } else {
            this.cd.detectChanges();
        }
      }
    });
  }

  // ── Confirm Review ──────────────────────────────────────────────────────
  openConfirmReviewModal(): void {
    const s = this.order?.status;
    if (s !== 'BUDGETED' && s !== 'CLIENT_REVIEW_PENDING') return;
    this.confirmReviewNotes = '';
    this.showConfirmReviewModal = true;
  }

  closeConfirmReviewModal(): void {
    if (!this.confirmingReview) {
      this.showConfirmReviewModal = false;
    }
  }

  confirmReview(): void {
    if (!this.order) return;
    this.confirmingReview = true;
    this.error = '';
    this.actionSuccessMessage = '';

    this.ordersService.confirmReview(this.order.id, this.confirmReviewNotes || undefined).subscribe({
      next: () => {
        this.confirmingReview = false;
        this.showConfirmReviewModal = false;
        this.actionSuccessMessage = 'Revisión confirmada correctamente.';
        if (this.order) this.loadOrder(this.order.id, true);
        else this.cd.detectChanges();
      },
      error: (err: any) => {
        this.confirmingReview = false;
        this.showConfirmReviewModal = false;
        this.error = err?.error?.message ?? 'No se pudo confirmar la revisión.';
        this.cd.detectChanges();
      },
    });
  }

  // ── Send Observation ─────────────────────────────────────────────────────
  submitObservation(): void {
    if (!this.order) return;
    const text = this.observationText.trim();
    if (!text) {
      this.observationError = 'La observación no puede estar vacía.';
      return;
    }
    this.submittingObservation = true;
    this.observationError = '';
    this.observationSuccess = '';

    this.ordersService.sendObservation(this.order.id, text).subscribe({
      next: () => {
        this.submittingObservation = false;
        this.observationSuccess = 'Observación enviada correctamente.';
        this.observationText = '';
        if (this.order) this.loadOrder(this.order.id, true);
        else this.cd.detectChanges();
      },
      error: (err: any) => {
        this.submittingObservation = false;
        this.observationError = err?.error?.message ?? 'No se pudo enviar la observación.';
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

  downloadFile(file: OrderFile): void {
    if (!this.order || !file.id) return;
    this.downloadingFileId = file.id;
    
    this.ordersService.downloadOrderFile(this.order.id, file.id).subscribe({
      next: (blob) => {
        this.downloadingFileId = null;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = (file.file_url ?? file.fileUrl ?? 'archivo').split('/').pop() || `archivo-${file.id}`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.downloadingFileId = null;
        this.error = 'No se pudo descargar el archivo.';
        this.cd.detectChanges();
      }
    });
  }

  getOperatorName(op: any): string {
    if (!op) return 'Operario asignado';
    const first = op.first_name || op.firstName || '';
    const last = op.last_name || op.lastName || '';
    return `${first} ${last}`.trim() || op.name || 'Operario asignado';
  }

  getOperatorInitials(op: any): string {
    const name = this.getOperatorName(op);
    const parts = name.trim().split(/\s+/);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? '').toUpperCase();
    return a + b;
  }

  getStatusMeta(status: string | null | undefined): OrderStatusMeta {
    const normalizedStatus = String(status ?? '').trim().toUpperCase() as OrderStatus;
    switch (normalizedStatus) {
      case 'BUDGETED':
        return { label: 'Presupuesto generado', classes: 'border-amber-300 bg-amber-50 text-amber-700' };
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

  getServiceName(): string {
    return this.order?.service_type?.name ?? this.order?.serviceType?.name ?? 'Servicio sin nombre';
  }

  getMaterialName(): string {
    return this.order?.material?.name ?? 'Material no especificado';
  }

  getEstimatedPrice(): number {
    return this.ordersService.getOrderEstimatedPrice(this.order);
  }

  getFinalPrice(): number | null {
    return this.ordersService.getOrderFinalPrice(this.order);
  }

  getPaymentRequiredAmount(): number {
    return this.ordersService.getPaymentRequiredAmount(this.order);
  }

  hasPriceAdjustment(): boolean {
    const fp = this.getFinalPrice();
    return fp !== null && !!this.order?.operator_price_adjustment_reason;
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
