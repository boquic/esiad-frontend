import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
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
export class OrderDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(ClientOrdersService);
  private cd = inject(ChangeDetectorRef);

  order: ClientOrderDetail | null = null;
  loading = false;
  error = '';

  // La confirmación de recogida ahora la realiza el operario en el local; el cliente ya no confirma nada.
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

  // ── Archivos: agregar/quitar antes de enviar a cotización ────────────────
  uploadingOrderFile = false;
  fileActionError = '';
  removingFileId: string | null = null;

  /**
   * true mientras hay una subida/eliminación de archivo en curso. Se usa
   * para bloquear "Reenviar a revisión" / "Confirmar revisión": si el
   * cliente confirma mientras una eliminación todavía está en camino al
   * servidor, el pedido puede cambiar de estado antes de que la
   * eliminación llegue, y el backend la rechaza (ya no es editable) sin
   * que el archivo viejo llegue a borrarse, dejando archivos duplicados.
   */
  get hasPendingFileOperation(): boolean {
    return this.uploadingOrderFile || !!this.removingFileId;
  }

  get isDraft(): boolean {
    return this.order?.status === 'DRAFT';
  }

  /**
   * El cliente puede editar notas y adjuntar/quitar archivos mientras el
   * pedido no se haya enviado a cotización todavía (DRAFT o BUDGETED), o si
   * el operario RECHAZÓ el pedido (CLIENT_REVIEW_PENDING sin precio final):
   * en ese caso el cliente puede ajustar archivos antes de reenviarlo a
   * revisión. A partir de OPERATOR_REVIEW_PENDING el operario ya empezó su
   * revisión y no se debe modificar; tampoco si ya fue aprobado con precio
   * (ahí solo corresponde confirmar y pagar).
   */
  get isEditableBeforeQuotation(): boolean {
    const s = this.order?.status;
    if (s === 'DRAFT' || s === 'BUDGETED') return true;
    return this.getReviewOutcome() === 'rejected';
  }

  /**
   * El operario recién fija un precio real al APROBAR durante su revisión.
   * Antes de eso (DRAFT, BUDGETED, en revisión, o si el operario RECHAZÓ el
   * pedido) no hay precio real que mostrar — mostrar "S/ 0.00" en esos casos
   * confundía, dando a entender que el pedido no cuesta nada.
   */
  get hasOperatorPricing(): boolean {
    return this.getFinalPrice() !== null;
  }

  /**
   * Cuando el pedido está en CLIENT_REVIEW_PENDING porque el operario ya lo
   * revisó (aprobó con precio, o rechazó con un motivo), indica cuál fue el
   * resultado para mostrar la frase correcta y habilitar la edición cuando
   * corresponda.
   */
  getReviewOutcome(): 'approved' | 'rejected' | null {
    const o = this.order;
    if (!o || o.status !== 'CLIENT_REVIEW_PENDING' || !o.operator_reviewed_at) return null;
    return this.getFinalPrice() !== null ? 'approved' : 'rejected';
  }

  /** Código corto para mostrar al cliente en vez del UUID completo. */
  get orderCode(): string {
    return this.order ? '#' + this.order.id.slice(0, 8).toUpperCase() : '';
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

  // Refresco periódico silencioso para que el cliente vea sin recargar
  // manualmente cuando el operario confirma/rechaza el pago, aprueba el
  // pedido, etc. (mismo patrón que la cola del operario).
  private readonly pollIntervalMs = 20000;
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.error = 'No se encontro el pedido solicitado.';
      return;
    }
    this.loadOrder(orderId);
    this.pollHandle = setInterval(() => this.loadOrder(orderId, true), this.pollIntervalMs);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
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
    if (!this.order || !this.isEditableBeforeQuotation) return;

    this.draftForm = {
      // El tipo de servicio solo se puede cambiar en DRAFT (en BUDGETED ya
      // hay un operario asignado según esa especialidad).
      serviceTypeId: this.isDraft ? String(this.order['service_type_id'] ?? '') : '',
      notes: this.order.notes ?? '',
    };
    this.editingDraft = true;
    this.draftError = '';
    this.fileActionError = '';

    if (this.isDraft && this.draftServices.length === 0) {
      this.loadDraftServices();
    }
  }

  cancelEditDraft(): void {
    if (this.savingDraft) return;
    this.editingDraft = false;
    this.draftError = '';
  }

  saveDraft(): void {
    if (!this.order || !this.isEditableBeforeQuotation || this.savingDraft) return;

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
          this.actionSuccessMessage = 'Pedido actualizado correctamente.';
          this.loadOrder(orderId, true);
        },
        error: (err: { error?: { message?: string } }) => {
          this.savingDraft = false;
          this.draftError = err.error?.message ?? 'No se pudo guardar los cambios.';
          this.cd.markForCheck();
        },
      });
  }

  // ── Archivos: agregar/quitar antes de enviar a cotización ────────────────

  onAddOrderFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length || !this.order || !this.isEditableBeforeQuotation) return;

    this.uploadFilesSequentially(this.order.id, files, 0);
  }

  private uploadFilesSequentially(orderId: string, files: File[], index: number): void {
    if (index >= files.length) {
      this.uploadingOrderFile = false;
      this.loadOrder(orderId, true);
      return;
    }

    this.uploadingOrderFile = true;
    this.fileActionError = '';

    this.ordersService.uploadOrderFile(orderId, files[index]).subscribe({
      next: () => {
        this.uploadFilesSequentially(orderId, files, index + 1);
      },
      error: (err: { error?: { message?: string } }) => {
        this.uploadingOrderFile = false;
        this.fileActionError = err.error?.message ?? 'No se pudo subir uno de los archivos.';
        this.loadOrder(orderId, true);
      },
    });
  }

  removeOrderFile(file: OrderFile): void {
    if (!this.order || !file.id || !this.isEditableBeforeQuotation || this.removingFileId) return;

    this.removingFileId = file.id;
    this.fileActionError = '';
    const orderId = this.order.id;

    this.ordersService.deleteOrderFile(orderId, file.id).subscribe({
      next: () => {
        this.removingFileId = null;
        this.loadOrder(orderId, true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.removingFileId = null;
        this.fileActionError = err.error?.message ?? 'No se pudo quitar el archivo.';
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

    const orderId = this.order.id;

    this.ordersService.confirmReview(orderId, this.confirmReviewNotes || undefined).subscribe({
      next: (response) => {
        this.confirmingReview = false;
        this.showConfirmReviewModal = false;
        // Si el cliente aceptó el precio del operario, el pedido pasa a
        // PENDING_PAYMENT: lo llevamos directo a la vista de pago (Yape) en
        // vez de dejarlo en el detalle a que busque cómo pagar.
        if (response?.data?.status === 'PENDING_PAYMENT') {
          this.router.navigate(['/client/orders', orderId, 'payment']);
          return;
        }
        this.actionSuccessMessage = 'Envío a cotización exitoso.';
        this.loadOrder(orderId, true);
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
        a.download = this.getFileDisplayName(file);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.cd.markForCheck();
      },
      error: (err: any) => {
        this.downloadingFileId = null;
        this.extractErrorMessage(err, 'No se pudo descargar el archivo.').then((msg) => {
          this.error = msg;
          this.cd.markForCheck();
        });
      }
    });
  }

  /**
   * Con `responseType: 'blob'`, el body de una respuesta de ERROR también
   * llega como Blob (no el JSON `{error, message}` que manda el backend),
   * así que antes siempre se mostraba el mensaje genérico de fallback en vez
   * de la causa real. Esto lee ese Blob como texto y lo parsea.
   */
  private extractErrorMessage(err: any, fallback: string): Promise<string> {
    if (err?.error instanceof Blob) {
      return err.error.text()
        .then((text: string) => {
          try {
            return JSON.parse(text)?.message || fallback;
          } catch {
            return fallback;
          }
        })
        .catch(() => fallback);
    }
    return Promise.resolve(err?.error?.message ?? fallback);
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
    const outcome = this.getReviewOutcome();
    if (outcome === 'approved') {
      return { label: 'Aprobado · revisa el precio', classes: 'border-teal-300 bg-teal-50 text-teal-700' };
    }
    if (outcome === 'rejected') {
      return { label: 'Rechazado por el operario', classes: 'border-red-300 bg-red-50 text-red-700' };
    }

    const normalizedStatus = String(status ?? '').trim().toUpperCase() as OrderStatus;
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
      case 'PAID':
        return { label: 'Pago confirmado', classes: 'border-teal-300 bg-teal-50 text-teal-700' };
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

  /**
   * true si el cliente ya subió un comprobante que sigue esperando que el
   * operario/admin lo verifique. Mientras esto sea true no tiene sentido
   * seguir pidiéndole "Realiza el adelanto": ya lo hizo, solo falta que se lo
   * confirmen.
   */
  hasPendingPaymentVoucher(): boolean {
    return this.ordersService.getOrderPayments(this.order).some((p) => p.status === 'PENDING');
  }

  /**
   * El operario fijó un precio final durante su revisión (independientemente
   * de si dejó o no un comentario). Antes esto exigía también que hubiera un
   * "motivo" para mostrarse, pero eso ocultaba el precio nuevo cuando el
   * operario aprobaba sin dejar comentario.
   */
  hasPriceAdjustment(): boolean {
    return this.getFinalPrice() !== null;
  }

  /** Comentario del operario al aprobar (opcional) o motivo por el que no aprobó el pedido (obligatorio en ese caso). */
  getOperatorReviewNote(): string | null {
    return this.order?.operator_price_adjustment_reason || null;
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

  getFileDisplayName(file: OrderFile): string {
    return this.ordersService.getFileDisplayName(file);
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
