import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { distinctUntilChanged } from 'rxjs';
import { getUserName } from '../../../core/utils/jwt.utils';
import {
  ClientOrderDetail,
  ClientOrdersService,
  CreateOrderPayload,
  MaterialOption,
  PricingModel,
  ServiceOption,
} from './orders.service';

type DynamicFieldConfig = {
  controlName: 'quantity' | 'area' | 'linearMeters' | 'hours' | 'volume';
  label: string;
  hint: string;
  placeholder: string;
  step: string;
};

type BudgetPreview = {
  measureLabel: string;
  units: number;
  unitName: string;
  unitPrice: number;
  total: number;
};

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
    materialId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    area: [1, [Validators.required, Validators.min(0.01)]],
    linearMeters: [1, [Validators.required, Validators.min(0.01)]],
    hours: [1, [Validators.required, Validators.min(0.01)]],
    volume: [1, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  // ── Service / Material state ──────────────────────────────────────────────

  services: ServiceOption[] = [];
  materials: MaterialOption[] = [];
  selectedService: ServiceOption | null = null;
  selectedMaterial: MaterialOption | null = null;
  pricingModel: PricingModel = 'UNKNOWN';
  preview: BudgetPreview | null = null;

  loadingServices = false;
  loadingMaterials = false;
  submitting = false;
  servicesError = '';
  materialsError = '';
  submitError = '';
  submitSuccess = '';
  createdOrder: ClientOrderDetail | null = null;

  // ── File upload (UI state) ────────────────────────────────────────────────

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

  // ── Pricing label helper for service cards ────────────────────────────────

  getPricingLabel(service: ServiceOption): string {
    const model = this.ordersService.normalizePricingModel(service);
    switch (model) {
      case 'PER_UNIT':         return 'Por unidad';
      case 'PER_AREA':         return 'Por m²';
      case 'FIXED':            return 'Precio fijo';
      case 'PER_VOLUME':       return 'Por volumen cm³';
      case 'PER_LINEAR_METER': return 'Por metro lineal';
      case 'PER_HOUR':         return 'Por hora';
      default:
        return service.description ? String(service.description) : 'Servicio personalizado';
    }
  }

  // ── isActive route helper ─────────────────────────────────────────────────

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '?');
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.orderForm.controls.serviceTypeId.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((serviceId) => {
        this.handleServiceChange(serviceId);
      });

    this.orderForm.controls.materialId.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((materialId) => {
        this.selectedMaterial =
          this.materials.find((m) => String(m.id) === materialId) ?? null;
        this.recalculatePreview();
      });

    this.orderForm.valueChanges.subscribe(() => {
      this.recalculatePreview();
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

  get activeField(): DynamicFieldConfig {
    switch (this.pricingModel) {
      case 'PER_AREA':
        return { controlName: 'area', label: 'Área requerida (m²)', hint: 'Total en metros cuadrados.', placeholder: 'Ej: 2.5', step: '0.01' };
      case 'PER_LINEAR_METER':
        return { controlName: 'linearMeters', label: 'Metros lineales', hint: 'Longitud total del trabajo.', placeholder: 'Ej: 4.2', step: '0.01' };
      case 'PER_HOUR':
        return { controlName: 'hours', label: 'Horas estimadas', hint: 'Cantidad de horas requeridas.', placeholder: 'Ej: 1.5', step: '0.25' };
      case 'PER_VOLUME':
        return { controlName: 'volume', label: 'Volumen (cm³)', hint: 'Total del volumen requerido.', placeholder: 'Ej: 150', step: '0.01' };
      case 'FIXED':
      case 'PER_UNIT':
      case 'UNKNOWN':
      default:
        return { controlName: 'quantity', label: 'Cantidad (unidades)', hint: 'Número de unidades requeridas.', placeholder: 'Ej: 10', step: '1' };
    }
  }

  get activeControlValue(): number {
    const raw = this.orderForm.controls[this.activeField.controlName].value;
    return typeof raw === 'number' ? raw : Number(raw ?? 0);
  }

  get requiresMeasurementInput(): boolean {
    return this.pricingModel !== 'FIXED';
  }

  get canShowPreview(): boolean {
    return this.selectedService !== null && this.selectedMaterial !== null && this.preview !== null;
  }

  get hasServices(): boolean {
    return this.services.length > 0;
  }

  get canSubmit(): boolean {
    return this.canShowPreview && !this.submitting;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submitOrder(): void {
    this.submitError = '';
    this.submitSuccess = '';
    this.createdOrder = null;

    if (this.orderForm.invalid || !this.selectedService || !this.selectedMaterial || !this.preview) {
      this.orderForm.markAllAsTouched();
      this.submitError = 'Completa los campos requeridos antes de crear el pedido.';
      return;
    }

    const payload = this.buildCreatePayload();
    this.submitting = true;

    this.ordersService.createOrder(payload).subscribe({
      next: (response) => {
        this.createdOrder = this.ordersService.unwrapResource(response);
        if (this.createdOrder && this.selectedFile) {
          this.ordersService.uploadOrderFile(this.createdOrder.id, this.selectedFile).subscribe({
            next: () => {
              this.submitting = false;
              this.submitSuccess = 'Pedido creado y plano técnico subido correctamente.';
              this.cd.markForCheck();
            },
            error: (err: { error?: { message?: string } }) => {
              this.submitting = false;
              this.submitSuccess = 'Pedido creado, pero no se pudo subir el plano técnico.';
              this.submitError = err.error?.message ?? 'No se pudo subir el archivo.';
              this.cd.markForCheck();
            }
          });
        } else {
          this.submitting = false;
          this.submitSuccess = 'Pedido creado y presupuesto generado correctamente.';
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

  private handleServiceChange(serviceId: string): void {
    this.selectedService = this.services.find((s) => String(s.id) === serviceId) ?? null;
    this.pricingModel = this.ordersService.normalizePricingModel(this.selectedService);
    this.materials = [];
    this.selectedMaterial = null;
    this.preview = null;
    this.submitError = '';
    this.submitSuccess = '';
    this.createdOrder = null;
    this.materialsError = '';
    this.orderForm.controls.materialId.setValue('', { emitEvent: false });
    this.resetMeasurementDefaults();

    if (!serviceId) return;

    this.loadingMaterials = true;
    this.ordersService.getMaterials(serviceId).subscribe({
      next: (response) => {
        const materials = this.ordersService.unwrapCollection(response);
        this.materials = materials.filter((m) => m.is_active !== false);
        this.loadingMaterials = false;

        const firstId = this.materials[0]?.id;
        if (firstId !== undefined) {
          this.orderForm.controls.materialId.setValue(String(firstId));
        } else {
          this.recalculatePreview();
        }
        this.cd.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.loadingMaterials = false;
        this.materialsError = err.error?.message ?? 'No se pudieron cargar los materiales.';
        this.cd.markForCheck();
      },
    });
  }

  private resetMeasurementDefaults(): void {
    this.orderForm.patchValue(
      { quantity: 1, area: 1, linearMeters: 1, hours: 1, volume: 1 },
      { emitEvent: false },
    );
  }

  private recalculatePreview(): void {
    if (!this.selectedService || !this.selectedMaterial) {
      this.preview = null;
      return;
    }

    const unitPrice = this.ordersService.getMaterialPrice(this.selectedMaterial);
    const config = this.activeField;
    const unitName = this.selectedMaterial.unit
      ? String(this.selectedMaterial.unit)
      : this.getDefaultUnitName();
    const units = this.requiresMeasurementInput
      ? this.readControlValue(config.controlName)
      : 1;

    if (!Number.isFinite(units) || units <= 0 || unitPrice < 0) {
      this.preview = null;
      return;
    }

    this.preview = {
      measureLabel: this.requiresMeasurementInput ? config.label : 'Tarifa fija',
      units,
      unitName,
      unitPrice,
      total: unitPrice * units,
    };
  }

  private readControlValue(controlName: DynamicFieldConfig['controlName']): number {
    const raw = this.orderForm.controls[controlName].value;
    return typeof raw === 'number' ? raw : Number(raw ?? 0);
  }

  private buildCreatePayload(): CreateOrderPayload {
    const payload: CreateOrderPayload = {
      service_type_id: this.orderForm.controls.serviceTypeId.value,
      material_id: this.orderForm.controls.materialId.value,
    };

    const notes = this.orderForm.controls.notes.value.trim();
    if (notes) payload.notes = notes;

    switch (this.pricingModel) {
      case 'PER_AREA':
        payload.area = this.readControlValue('area');
        break;
      case 'PER_VOLUME':
        payload.volume = this.readControlValue('volume');
        break;
      case 'FIXED':
        break;
      default:
        payload.quantity = this.readQuantityValueForBackend();
        break;
    }

    return payload;
  }

  private readQuantityValueForBackend(): number {
    switch (this.pricingModel) {
      case 'PER_LINEAR_METER': return this.readControlValue('linearMeters');
      case 'PER_HOUR':         return this.readControlValue('hours');
      default:                 return this.readControlValue('quantity');
    }
  }

  private getDefaultUnitName(): string {
    switch (this.pricingModel) {
      case 'PER_AREA':         return 'm²';
      case 'PER_VOLUME':       return 'cm³';
      case 'PER_LINEAR_METER': return 'm';
      case 'PER_HOUR':         return 'hora';
      case 'FIXED':            return 'servicio';
      default:                 return 'unidad';
    }
  }
}
