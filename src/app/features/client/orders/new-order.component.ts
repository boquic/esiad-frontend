import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { getUserName } from '../../../core/utils/jwt.utils';
import {
  ClientOrderDetail,
  ClientOrdersService,
  CreateOrderPayload,
  ServiceOption,
} from './orders.service';

@Component({
  selector: 'app-new-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-order.component.html',
})
export class NewOrderComponent {
  private fb = inject(FormBuilder);
  private ordersService = inject(ClientOrdersService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  readonly String = String;

  getControl(name: string): AbstractControl | null {
    return this.orderForm.get(name);
  }

  // ── User ──────────────────────────────────────────────────────────────────

  readonly userName: string = getUserName() || 'Usuario';

  get userFirstName(): string {
    return this.userName.split(' ')[0] ?? this.userName;
  }

  get userInitials(): string {
    const parts = this.userName.trim().split(/\s+/);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? '').toUpperCase();
    return a + b;
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  readonly orderForm = this.fb.nonNullable.group({
    serviceTypeId: ['', Validators.required],
    notes: [''],
  });

  /** Ejemplos sugeridos para el campo de notas. */
  readonly noteExamples: string[] = [
    'Escala 50%',
    'Escala 100%',
    'Indicaciones de corte',
    'Color / acabado',
  ];

  applyNoteExample(example: string): void {
    const current = this.orderForm.controls.notes.value.trim();
    const next = current ? `${current}, ${example}` : example;
    this.orderForm.controls.notes.setValue(next);
  }

  // ── Service state ─────────────────────────────────────────────────────────

  services: ServiceOption[] = [];
  selectedService: ServiceOption | null = null;

  loadingServices = false;
  submitting = false;
  servicesError = '';
  submitError = '';
  submitSuccess = '';
  createdOrder: ClientOrderDetail | null = null;

  // ── File upload ───────────────────────────────────────────────────────────

  selectedFile: File | null = null;
  fileError = '';

  /** Corte láser: el cliente solo puede subir .dwg para asegurar compatibilidad con la máquina de corte. */
  get isLaserService(): boolean {
    return this.ordersService.normalizePricingModel(this.selectedService) === 'PER_UNIT';
  }

  get acceptedFileExtensions(): string[] {
    return this.isLaserService ? ['.dwg'] : ['.dwg', '.dxf', '.pdf'];
  }

  get fileInputAccept(): string {
    return this.acceptedFileExtensions.join(',');
  }

  get acceptedFileExtensionsLabel(): string {
    return this.acceptedFileExtensions.join(', ');
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    const accepted = this.applySelectedFile(file);
    if (!accepted) {
      input.value = '';
    }
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  isDraggingFile = false;

  onDropzoneDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = true;
  }

  onDropzoneDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
  }

  onDropzoneDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;

    const file = event.dataTransfer?.files?.[0] ?? null;
    if (!file) return;
    this.applySelectedFile(file);
  }

  /** Valida y guarda un archivo, venga del input file o de un arrastre. Devuelve true si fue aceptado. */
  private applySelectedFile(file: File): boolean {
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (!this.acceptedFileExtensions.includes(ext)) {
      this.fileError = this.isLaserService
        ? 'Este servicio es de corte láser: solo se acepta el formato .dwg'
        : 'Solo se aceptan archivos .dwg, .dxf o .pdf';
      this.selectedFile = null;
      this.cd.markForCheck();
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.fileError = 'El archivo no puede superar 20 MB';
      this.selectedFile = null;
      this.cd.markForCheck();
      return false;
    }
    this.selectedFile = file;
    this.fileError = '';
    this.cd.markForCheck();
    return true;
  }

  get fileSizeMB(): string {
    if (!this.selectedFile) return '';
    return (this.selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ── isActive route helper ─────────────────────────────────────────────────

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '?');
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.orderForm.controls.serviceTypeId.valueChanges.subscribe((serviceId) => {
      this.selectedService = this.services.find((s) => String(s.id) === serviceId) ?? null;
      this.submitError = '';
      this.submitSuccess = '';
      this.createdOrder = null;

      // Si el archivo ya seleccionado ya no es válido para el nuevo servicio (ej. cambia a corte láser), se descarta.
      if (this.selectedFile) {
        const ext = '.' + (this.selectedFile.name.split('.').pop() ?? '').toLowerCase();
        if (!this.acceptedFileExtensions.includes(ext)) {
          this.selectedFile = null;
          this.fileError = this.isLaserService
            ? 'Este servicio es de corte láser: vuelve a adjuntar el plano en formato .dwg'
            : 'Vuelve a adjuntar el archivo del plano';
        }
      }
    });

    this.loadServices();
  }

  loadServices(): void {
    this.loadingServices = true;
    this.servicesError = '';

    this.ordersService.getServices().subscribe({
      next: (response) => {
        const services = this.ordersService.unwrapCollection(response);
        this.services = services.filter((s) => s.is_active !== false);
        this.loadingServices = false;

        const firstId = this.services[0]?.id;
        if (firstId !== undefined) {
          this.orderForm.controls.serviceTypeId.setValue(String(firstId));
        }
        this.cd.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.loadingServices = false;
        this.servicesError = err.error?.message ?? 'No se pudieron cargar los servicios.';
        this.cd.markForCheck();
      },
    });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }

  // ── Computed getters ──────────────────────────────────────────────────────

  get hasServices(): boolean {
    return this.services.length > 0;
  }

  get canSubmit(): boolean {
    return this.selectedService !== null && this.selectedFile !== null && !this.submitting;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submitOrder(): void {
    this.submitError = '';
    this.submitSuccess = '';

    if (this.orderForm.invalid || !this.selectedService) {
      this.orderForm.markAllAsTouched();
      this.submitError = 'Selecciona un tipo de servicio antes de continuar.';
      return;
    }

    if (!this.selectedFile) {
      this.fileError = `Debes adjuntar el archivo del plano (${this.acceptedFileExtensionsLabel}).`;
      this.submitError = 'Adjunta el archivo del plano antes de continuar.';
      return;
    }

    const payload = this.buildCreatePayload();
    this.submitting = true;
    const file = this.selectedFile;

    // Si un intento anterior ya creó el borrador, se reintenta desde ahí en vez
    // de crear un pedido duplicado.
    const existingDraft = this.createdOrder;

    if (existingDraft) {
      this.ordersService.updateDraft(existingDraft.id, { notes: payload.notes ?? null }).subscribe({
        next: () => this.uploadAndSend(existingDraft.id, file),
        error: () => this.uploadAndSend(existingDraft.id, file),
      });
      return;
    }

    // El pedido se crea como borrador (DRAFT), se le adjunta el plano y
    // finalmente se envía (DRAFT → BUDGETED).
    this.ordersService.createOrder(payload).subscribe({
      next: (response) => {
        const draft = this.ordersService.unwrapResource(response);
        this.createdOrder = draft;

        if (!draft) {
          this.submitting = false;
          this.submitError = 'No se pudo crear el borrador del pedido.';
          this.cd.markForCheck();
          return;
        }

        this.uploadAndSend(draft.id, file);
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError = err.error?.message ?? 'No se pudo crear el pedido.';
        this.cd.markForCheck();
      },
    });
  }

  /** Elimina el borrador creado si el cliente decide descartarlo. */
  discardDraft(): void {
    if (!this.createdOrder || this.submitSuccess) return;

    const draftId = this.createdOrder.id;
    this.submitting = true;

    this.ordersService.deleteDraft(draftId).subscribe({
      next: () => {
        this.submitting = false;
        this.createdOrder = null;
        this.submitError = '';
        this.cd.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError = err.error?.message ?? 'No se pudo eliminar el borrador.';
        this.cd.markForCheck();
      },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private uploadAndSend(draftId: string, file: File): void {
    this.ordersService.uploadOrderFile(draftId, file).subscribe({
      next: () => this.sendDraft(draftId),
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError =
          err.error?.message ?? 'No se pudo subir el archivo. Tu borrador se guardó.';
        this.cd.markForCheck();
      },
    });
  }

  private sendDraft(draftId: string): void {
    this.ordersService.submitDraft(draftId).subscribe({
      next: () => {
        this.submitting = false;
        // El pedido ya fue enviado (DRAFT -> BUDGETED): en vez de dejar al
        // cliente en el formulario con un mensaje de éxito, lo llevamos
        // directo al detalle de su pedido para que pueda enviarlo a
        // cotización sin tener que ir a "Mis pedidos" primero.
        this.router.navigate(['/client/orders', draftId]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError =
          err.error?.message ?? 'No se pudo enviar el pedido. Tu borrador se guardó.';
        this.cd.markForCheck();
      },
    });
  }

  private buildCreatePayload(): CreateOrderPayload {
    const payload: CreateOrderPayload = {
      service_type_id: this.orderForm.controls.serviceTypeId.value,
    };

    const notes = this.orderForm.controls.notes.value.trim();
    if (notes) payload.notes = notes;

    return payload;
  }
}
