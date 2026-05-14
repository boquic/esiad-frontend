import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from './materials.service';
import { ServicesService } from '../services/services.service';

type MaterialItem = {
  id: string | number;
  name: string;
  unit_price: number | string;
  unit?: string | null;
  is_active: boolean;
  service_type?: { name?: string | null } | null;
};

@Component({
  selector: 'app-materials-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './materials-admin.component.html'
})
export class MaterialsAdminComponent {
  private svc = inject(MaterialsService);
  private servicesSvc = inject(ServicesService);
  private cd = inject(ChangeDetectorRef);

  services: Array<{ id: string | number; name: string }> = [];
  materials: MaterialItem[] = [];
  selectedServiceId: string | number | null = null;
  loading = false;
  error = '';

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.servicesSvc.getServices().subscribe({
      next: (res) => {
        this.services = (Array.isArray(res) ? res : (res?.data || [])).map(s => ({ id: s.id, name: s.name }));
        if (this.services.length) {
          this.selectedServiceId = this.services[0].id;
          this.loadMaterials();
        }
        this.cd.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los servicios';
        this.cd.detectChanges();
      }
    });
  }

  loadMaterials() {
    if (this.selectedServiceId == null) return;
    this.loading = true;
    this.error = '';
    this.svc.getMaterials(String(this.selectedServiceId)).subscribe({
      next: (res) => { this.materials = Array.isArray(res) ? res : (res?.data || []); this.loading = false; this.cd.detectChanges(); },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'No se pudieron cargar los materiales'; this.cd.detectChanges(); }
    });
  }

  toggle(item: MaterialItem) {
    const confirmMsg = item.is_active ? `Desactivar ${item.name}?` : `Activar ${item.name}?`;
    if (!confirm(confirmMsg)) return;
    this.svc.toggleMaterial(String(item.id)).subscribe({ next: () => this.loadMaterials(), error: (e) => alert(e?.error?.message || 'Error') });
  }

  edit(item: MaterialItem) {
    const newName = prompt('Nuevo nombre del material', item.name);
    if (newName == null) return;
    const priceStr = prompt('Nuevo precio unitario (ej: 5.50)', String(item.unit_price));
    if (priceStr == null) return;
    const unitPrice = Number(priceStr);
    if (!newName.trim() || Number.isNaN(unitPrice)) return alert('Datos inválidos');
    this.svc.updateMaterial(String(item.id), { name: newName.trim(), unit_price: unitPrice }).subscribe({ next: () => this.loadMaterials(), error: (e) => alert(e?.error?.message || 'Error') });
  }
}
