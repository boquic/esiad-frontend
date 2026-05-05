import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from './materials.service';
import { ServicesService } from '../services/services.service';

type MaterialItem = {
  id: string | number;
  name: string;
  price: number;
  is_active: boolean;
  serviceTypeId?: string | number;
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
        this.services = res.map(s => ({ id: s.id, name: s.name }));
        if (this.services.length) {
          this.selectedServiceId = this.services[0].id;
          this.loadMaterials();
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los servicios';
      }
    });
  }

  loadMaterials() {
    if (this.selectedServiceId == null) return;
    this.loading = true;
    this.error = '';
    this.svc.getMaterials(String(this.selectedServiceId)).subscribe({
      next: (res) => { this.materials = res || []; this.loading = false; },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'No se pudieron cargar los materiales'; }
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
    const priceStr = prompt('Nuevo precio (ej: 5.50)', String(item.price));
    if (priceStr == null) return;
    const price = Number(priceStr);
    if (!newName.trim() || Number.isNaN(price)) return alert('Datos inválidos');
    this.svc.updateMaterial(String(item.id), { name: newName.trim(), price }).subscribe({ next: () => this.loadMaterials(), error: (e) => alert(e?.error?.message || 'Error') });
  }
}
