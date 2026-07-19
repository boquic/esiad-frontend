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
  ServiceOption,
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

  // ── Borrador (DRAFT) ─────────────────────────────────────────────────────
  submittingDraft = false;
  draftSuccessMessage = '';
  draftError = '';

  editingDraft = false;
  savingDraft = false;
  draftServices: ServiceOption[] = [];
  loadingDraftServices = false;
  draftForm = { serviceTypeId: '', notes: '' };

  showDeleteDraftModal = false;
  deletingDraft = false;

  get isDraft(): boolean {
    return this.order?.status === 'DRAFT';
  }

  // Payment voucher upload (PENDING_PAYMENT)
  selectedPaymentFile: File | null = null;
  uploadingPayment = false;
  paymentUploadError = '';
  paymentUploadSuccess = '';

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
        // DEBUG: ver estructura del operario en consola
        if (this.order?.operator) {
          console.log('[order-detail] operator data:', JSON.stringify(this.order.operator, null, 2));
        }
        if (!silent) this.loading = false;
        if (!this.order) {
          this.error = 'No se encontro el detalle del pedido.';
        }
        this.cd.markForCheck();
      },
      error: (error: { error?: { message?: string } }) => {
        if (!silent) this.loading = false;
        this.error = error.error?.message ?? 'No se pudo cargar el detalle del pedido.';
        this.cd.markForCheck();
      },
    });
  }

  // ── Borrador: enviar a cotización ────────────────────────────────────────

  submitDraft(): void {
    if (!this.order || !this.isDraft || this.submittingDraft) return;

    this.submittingDraft = true;
    this.draftError = '';
    this.draftSuccessMessage = '';
    const orderId = this.order.id;

    this.ordersService.submitDraft(orderId).subscribe({
      next: () => {
        this.submittingDraft = false;
        this.editingDraft = false;
        this.draftSuccessMessage = 'Tu pedido fue enviado, el operario te cotizará pronto.';
        this.loadOrder(orderId, true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.submittingDraft = false;
        this.draftError = err.error?.message ?? 'No se pudo enviar el pedido a cotización.';
        this.cd.markForCheck();
      },
    });
  }

  // ── Borrador: editar ─────────────────────────────────────────────────────

  startEditDraft(): void {
    if (!this.order || !this.isDraft) return;

    this.draftForm = {
      serviceTypeId: String(this.order['service_type_id'] ?? ''),
      notes: this.order.notes ?? '',
    };
    this.editingDraft = true;
    this.draftError = '';

    if (this.draftServices.length === 0) {
      this.loadDraftServices();
    }
  }

  cancelEditDraft(): void {
    if (this.savingDraft) return;
    this.editingDraft = false;
    this.draftError = '';
  }

  saveDraft(): void {
    if (!this.order || !this.isDraft || this.savingDraft) return;

    this.savingDraft = true;
    this.draftError = '';
    const orderId = this.order.id;

    this.ordersService
      .updateDraft(orderId, {
        service_type_id: this.draftForm.serviceTypeId || undefined,
        notes: this.draftForm.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.savingDraft = false;
          this.editingDraft = false;
          this.actionSuccessMessage = 'Borrador actualizado correctamente.';
          this.loadOrder(orderId, true);
        },
        error: (err: { error?: { message?: string } }) => {
          this.savingDraft = false;
          this.draftError = err.error?.message ?? 'No se pudo guardar el borrador.';
          this.cd.markForCheck();
        },
      });
  }

  private loadDraftServices(): void {
    this.loadingDraftServices = true;

    this.ordersService.getServices().subscribe({
      next: (response) => {
        this.draftServices = this.ordersService
          .unwrapCollection(response)
          .filter((s) => s.is_active !== false);
        this.loadingDraftServices = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loadingDraftServices = false;
        this.cd.markForCheck();
      },
    });
  }

  // ── Borrador: eliminar ───────────────────────────────────────────────────

  openDeleteDraftModal(): void {
    if (!this.isDraft) return;
    this.showDeleteDraftModal = true;
  }

  closeDeleteDraftModal(): void {
    if (!this.deletingDraft) {
      this.showDeleteDraftModal = false;
    }
  }

  deleteDraft(): void {
    if (!this.order || !this.isDraft || this.deletingDraft) return;

    this.deletingDraft = true;
    this.draftError = '';

    this.ordersService.deleteDraft(this.order.id).subscribe({
      next: () => {
        this.deletingDraft = false;
        this.showDeleteDraftModal = false;
        this.router.navigate(['/client/orders']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.deletingDraft = false;
        this.showDeleteDraftModal = false;
        this.draftError = err.error?.message ?? 'No se pudo eliminar el borrador.';
        this.cd.markForCheck();
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
          this.cd.markForCheck();
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
            this.cd.markForCheck();
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
        else this.cd.markForCheck();
      },
      error: (err: any) => {
        this.confirmingReview = false;
        this.showConfirmReviewModal = false;
        this.error = err?.error?.message ?? 'No se pudo confirmar la revisión.';
        this.cd.markForCheck();
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
        else this.cd.markForCheck();
      },
      error: (err: any) => {
        this.submittingObservation = false;
        this.observationError = err?.error?.message ?? 'No se pudo enviar la observación.';
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
        this.cd.markForCheck();
      },
      error: (err) => {
        this.downloadingFileId = null;
        this.error = 'No se pudo descargar el archivo.';
        this.cd.markForCheck();
      }
    });
  }

  getOperatorName(op: any): string {
    if (!op) return 'Operario asignado';

    // Si el operario tiene subobjeto user (patrón NestJS relacional)
    const u = op.user ?? op;

    const first =
      u.first_name  ?? u.firstName  ??
      op.first_name ?? op.firstName ?? '';

    const last =
      u.last_name  ?? u.lastName  ??
      op.last_name ?? op.lastName ?? '';

    const fullFromParts = `${first} ${last}`.trim();
    if (fullFromParts) return fullFromParts;

    // Campos de nombre completo directos
    return (
      u.full_name  ?? u.fullName  ??
      op.full_name ?? op.fullName ??
      u.name       ?? op.name     ??
      u.username   ?? op.username ??
      u.email      ?? op.email    ??
      'Operario asignado'
    );
  }

  getOperatorInitials(op: any): string {
    const name = this.getOperatorName(op);
    if (name === 'Operario asignado') return 'OP';
    const parts = name.trim().split(/\s+/);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? '').toUpperCase();
    return a + b || 'OP';
  }

  getStatusMeta(status: string | null | undefined): OrderStatusMeta {
    const normalizedStatus = String(status ?? '').trim().toUpperCase() as OrderStatus;
    switch (normalizedStatus) {
      case 'DRAFT':
        return { label: 'Borrador', classes: 'border-slate-300 bg-slate-50 text-slate-600' };
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

  // ── Payment voucher ──────────────────────────────────────────────────────
  onPaymentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPaymentFile = input.files?.[0] ?? null;
    this.paymentUploadError = '';
  }

  uploadPaymentVoucher(): void {
    if (!this.order || !this.selectedPaymentFile) return;
    this.uploadingPayment = true;
    this.paymentUploadError = '';
    this.paymentUploadSuccess = '';

    this.ordersService.uploadPaymentVoucher(this.order.id, this.selectedPaymentFile).subscribe({
      next: () => {
        this.uploadingPayment = false;
        this.paymentUploadSuccess = '¡Comprobante enviado! El operario revisará tu pago y comenzará la producción.';
        this.selectedPaymentFile = null;
        if (this.order) this.loadOrder(this.order.id, true);
        else this.cd.markForCheck();
      },
      error: (err: any) => {
        this.uploadingPayment = false;
        this.paymentUploadError = err?.error?.message ?? 'No se pudo enviar el comprobante. Intenta de nuevo.';
        this.cd.markForCheck();
      },
    });
  }
}
