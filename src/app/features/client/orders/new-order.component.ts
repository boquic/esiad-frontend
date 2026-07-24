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

  /** Uno o más archivos (planos, referencias, etc.) para el mismo pedido. */
  selectedFiles: File[] = [];
  fileError = '';

  get hasSelectedFiles(): boolean {
    return this.selectedFiles.length > 0;
  }

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
    if (!input.files || input.files.length === 0) return;

    this.addFiles(input.files);
    // Se limpia para que seleccionar el mismo archivo otra vez vuelva a disparar el evento.
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.fileError = '';
    this.cd.markForCheck();
  }

  getFileSizeLabel(file: File): string {
    return (file.size / (1024 * 1024)).toFixed(1) + ' MB';
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

    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    this.addFiles(event.dataTransfer.files);
  }

  /**
   * Valida y agrega uno o más archivos a la selección (venga del input file o
   * de un arrastre). Los archivos válidos se agregan a los ya seleccionados;
   * los inválidos se descartan mostrando el motivo del último rechazado.
   */
  private addFiles(files: FileList | File[]): void {
    let lastError = '';

    for (const file of Array.from(files)) {
      const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();

      if (!this.acceptedFileExtensions.includes(ext)) {
        lastError = this.isLaserService
          ? 'Este servicio es de corte láser: solo se acepta el formato .dwg'
          : 'Solo se aceptan archivos .dwg, .dxf o .pdf';
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        lastError = `El archivo "${file.name}" no puede superar 20 MB`;
        continue;
      }

      const isDuplicate = this.selectedFiles.some((f) => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        continue;
      }

      this.selectedFiles = [...this.selectedFiles, file];
    }

    this.fileError = lastError;
    this.cd.markForCheck();
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

      // Los archivos ya seleccionados que ya no sean válidos para el nuevo servicio
      // (ej. cambia a corte láser) se descartan; el resto se conserva.
      if (this.hasSelectedFiles) {
        const stillValid = this.selectedFiles.filter((file) => {
          const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
          return this.acceptedFileExtensions.includes(ext);
        });

        if (stillValid.length !== this.selectedFiles.length) {
          this.selectedFiles = stillValid;
          this.fileError = this.isLaserService
            ? 'Este servicio es de corte láser: se quitaron los archivos que no eran .dwg'
            : 'Se quitaron archivos que ya no son válidos para este servicio';
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
    return this.selectedService !== null && this.hasSelectedFiles && !this.submitting;
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

    if (!this.hasSelectedFiles) {
      this.fileError = `Debes adjuntar al menos un archivo del plano (${this.acceptedFileExtensionsLabel}).`;
      this.submitError = 'Adjunta al menos un archivo del plano antes de continuar.';
      return;
    }

    const payload = this.buildCreatePayload();
    this.submitting = true;
    const files = this.selectedFiles;

    // Si un intento anterior ya creó el borrador, se reintenta desde ahí en vez
    // de crear un pedido duplicado.
    const existingDraft = this.createdOrder;

    if (existingDraft) {
      this.ordersService.updateDraft(existingDraft.id, { notes: payload.notes ?? null }).subscribe({
        next: () => this.uploadAndSend(existingDraft.id, files),
        error: () => this.uploadAndSend(existingDraft.id, files),
      });
      return;
    }

    // El pedido se crea como borrador (DRAFT), se le adjuntan los archivos y
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

        this.uploadAndSend(draft.id, files);
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

  /** Sube los archivos uno por uno (el backend recibe un archivo por request) y, al terminar todos, envía el borrador. */
  private uploadAndSend(draftId: string, files: File[], index = 0): void {
    if (index >= files.length) {
      this.sendDraft(draftId);
      return;
    }

    this.ordersService.uploadOrderFile(draftId, files[index]).subscribe({
      next: () => this.uploadAndSend(draftId, files, index + 1),
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError =
          err.error?.message ?? `No se pudo subir "${files[index].name}". Tu borrador se guardó.`;
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
