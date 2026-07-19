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

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (!['.dwg', '.dxf', '.pdf'].includes(ext)) {
      this.fileError = 'Solo se aceptan archivos .dwg, .dxf o .pdf';
      this.selectedFile = null;
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.fileError = 'El archivo no puede superar 20 MB';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
    this.fileError = '';
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
    this.createdOrder = null;

    if (this.orderForm.invalid || !this.selectedService) {
      this.orderForm.markAllAsTouched();
      this.submitError = 'Selecciona un tipo de servicio antes de continuar.';
      return;
    }

    if (!this.selectedFile) {
      this.fileError = 'Debes adjuntar el archivo del plano (.dwg, .dxf o .pdf).';
      this.submitError = 'Adjunta el archivo del plano antes de continuar.';
      return;
    }

    const payload = this.buildCreatePayload();
    this.submitting = true;
    const file = this.selectedFile;

    this.ordersService.createOrder(payload).subscribe({
      next: (response) => {
        this.createdOrder = this.ordersService.unwrapResource(response);
        if (this.createdOrder) {
          this.ordersService.uploadOrderFile(this.createdOrder.id, file).subscribe({
            next: () => {
              this.submitting = false;
              this.submitSuccess = 'Pedido creado y archivo subido correctamente.';
              this.cd.markForCheck();
            },
            error: (err: { error?: { message?: string } }) => {
              this.submitting = false;
              this.submitSuccess = 'Pedido creado, pero no se pudo subir el archivo.';
              this.submitError = err.error?.message ?? 'No se pudo subir el archivo.';
              this.cd.markForCheck();
            },
          });
        } else {
          this.submitting = false;
          this.submitSuccess = 'Pedido creado correctamente.';
          this.cd.markForCheck();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.submitError = err.error?.message ?? 'No se pudo crear el pedido.';
        this.cd.markForCheck();
      },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private buildCreatePayload(): CreateOrderPayload {
    const payload: CreateOrderPayload = {
      service_type_id: this.orderForm.controls.serviceTypeId.value,
    };

    const notes = this.orderForm.controls.notes.value.trim();
    if (notes) payload.notes = notes;

    return payload;
  }
}
