import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { distinctUntilChanged } from 'rxjs';
import {
  ClientOrdersService,
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './new-order.component.html',
})
export class NewOrderComponent {
  private fb = inject(FormBuilder);
  private ordersService = inject(ClientOrdersService);
  private router = inject(Router);

  readonly orderForm = this.fb.nonNullable.group({
    serviceTypeId: ['', Validators.required],
    materialId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    area: [1, [Validators.required, Validators.min(0.01)]],
    linearMeters: [1, [Validators.required, Validators.min(0.01)]],
    hours: [1, [Validators.required, Validators.min(0.01)]],
    volume: [1, [Validators.required, Validators.min(0.01)]],
  });

  services: ServiceOption[] = [];
  materials: MaterialOption[] = [];
  selectedService: ServiceOption | null = null;
  selectedMaterial: MaterialOption | null = null;
  pricingModel: PricingModel = 'UNKNOWN';
  preview: BudgetPreview | null = null;

  loadingServices = false;
  loadingMaterials = false;
  servicesError = '';
  materialsError = '';

  ngOnInit(): void {
    this.orderForm.controls.serviceTypeId.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((serviceId) => {
        this.handleServiceChange(serviceId);
      });

    this.orderForm.controls.materialId.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((materialId) => {
        this.selectedMaterial = this.materials.find((material) => String(material.id) === materialId) ?? null;
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
        this.services = services.filter((service) => service.is_active !== false);
        this.loadingServices = false;

        const firstServiceId = this.services[0]?.id;
        if (firstServiceId !== undefined) {
          this.orderForm.controls.serviceTypeId.setValue(String(firstServiceId));
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.loadingServices = false;
        this.servicesError = error.error?.message ?? 'No se pudieron cargar los servicios.';
      },
    });
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }

  get activeField(): DynamicFieldConfig {
    switch (this.pricingModel) {
      case 'PER_AREA':
        return {
          controlName: 'area',
          label: 'Area requerida',
          hint: 'Ingresa el total en metros cuadrados.',
          placeholder: 'Ej: 2.5',
          step: '0.01',
        };
      case 'PER_LINEAR_METER':
        return {
          controlName: 'linearMeters',
          label: 'Metros lineales',
          hint: 'Ingresa la longitud total del trabajo.',
          placeholder: 'Ej: 4.2',
          step: '0.01',
        };
      case 'PER_HOUR':
        return {
          controlName: 'hours',
          label: 'Horas estimadas',
          hint: 'Ingresa la cantidad de horas requeridas.',
          placeholder: 'Ej: 1.5',
          step: '0.25',
        };
      case 'PER_VOLUME':
        return {
          controlName: 'volume',
          label: 'Volumen',
          hint: 'Ingresa el total del volumen requerido.',
          placeholder: 'Ej: 150',
          step: '0.01',
        };
      case 'FIXED':
      case 'PER_UNIT':
      case 'UNKNOWN':
      default:
        return {
          controlName: 'quantity',
          label: 'Cantidad',
          hint: 'Ingresa el numero de unidades requeridas.',
          placeholder: 'Ej: 3',
          step: '1',
        };
    }
  }

  get activeControlValue(): number {
    const rawValue = this.orderForm.controls[this.activeField.controlName].value;
    return typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  }

  get requiresMeasurementInput(): boolean {
    return this.pricingModel !== 'FIXED';
  }

  get canShowPreview(): boolean {
    return this.selectedService !== null && this.selectedMaterial !== null && this.preview !== null;
  }

  private handleServiceChange(serviceId: string): void {
    this.selectedService = this.services.find((service) => String(service.id) === serviceId) ?? null;
    this.pricingModel = this.ordersService.normalizePricingModel(this.selectedService);
    this.materials = [];
    this.selectedMaterial = null;
    this.preview = null;
    this.materialsError = '';
    this.orderForm.controls.materialId.setValue('', { emitEvent: false });
    this.resetMeasurementDefaults();

    if (!serviceId) {
      return;
    }

    this.loadingMaterials = true;
    this.ordersService.getMaterials(serviceId).subscribe({
      next: (response) => {
        const materials = this.ordersService.unwrapCollection(response);
        this.materials = materials.filter((material) => material.is_active !== false);
        this.loadingMaterials = false;

        const firstMaterialId = this.materials[0]?.id;
        if (firstMaterialId !== undefined) {
          this.orderForm.controls.materialId.setValue(String(firstMaterialId));
        } else {
          this.recalculatePreview();
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.loadingMaterials = false;
        this.materialsError = error.error?.message ?? 'No se pudieron cargar los materiales.';
      },
    });
  }

  private resetMeasurementDefaults(): void {
    this.orderForm.patchValue(
      {
        quantity: 1,
        area: 1,
        linearMeters: 1,
        hours: 1,
        volume: 1,
      },
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
    const unitName = this.selectedMaterial.unit ? String(this.selectedMaterial.unit) : this.getDefaultUnitName();
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
    const rawValue = this.orderForm.controls[controlName].value;
    return typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  }

  private getDefaultUnitName(): string {
    switch (this.pricingModel) {
      case 'PER_AREA':
        return 'm2';
      case 'PER_VOLUME':
        return 'cm3';
      case 'PER_LINEAR_METER':
        return 'm';
      case 'PER_HOUR':
        return 'hora';
      case 'FIXED':
        return 'servicio';
      case 'PER_UNIT':
      case 'UNKNOWN':
      default:
        return 'unidad';
    }
  }
}
