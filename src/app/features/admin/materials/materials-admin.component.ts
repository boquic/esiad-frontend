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
  templateUrl: './materials-admin.component.html',
  styles: [`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-enter { animation: modalIn 0.2s ease-out; }
  `]
})
export class MaterialsAdminComponent {
  private svc       = inject(MaterialsService);
  private servicesSvc = inject(ServicesService);
  private cd        = inject(ChangeDetectorRef);

  services: Array<{ id: string | number; name: string }> = [];
  materials: MaterialItem[] = [];
  selectedServiceId: string | number | null = null;
  loading = false;
  error   = '';

  // ── Modal crear material ───────────────────────────────────────
  showCreateModal    = false;
  creating           = false;
  createError        = '';
  newName            = '';
  newUnit            = 'unidad';
  newPrice: number | null = null;
  newServiceId: string | number | null = null;

  // ── Modal confirmar toggle ─────────────────────────────────────
  showToggleModal  = false;
  toggleTarget: MaterialItem | null = null;
  toggling         = false;

  // ── Modal eliminar material ────────────────────────────────────
  showDeleteModal  = false;
  deleteTarget: MaterialItem | null = null;
  deleting         = false;

  openDeleteModal(item: MaterialItem) {
    this.deleteTarget    = item;
    this.showDeleteModal = true;
    this.cd.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteTarget    = null;
    this.cd.detectChanges();
  }

  confirmDelete() {
    const item = this.deleteTarget;
    if (!item) return;
    this.deleting = true;
    this.svc.deleteMaterial(String(item.id)).subscribe({
      next: () => {
        this.deleting = false;
        this.closeDeleteModal();
        this.loadMaterials();
      },
      error: (e) => {
        this.deleting = false;
        this.closeDeleteModal();
        this.openAlert(e?.error?.message || 'No se pudo eliminar el material');
      }
    });
  }

  // ── Modal editar material ──────────────────────────────────────
  showEditModal = false;
  editTarget: MaterialItem | null = null;
  editName      = '';
  editPrice: number | null = null;
  editSaving    = false;
  editError     = '';

  // ── Modal alerta genérica ──────────────────────────────────────
  showAlertModal = false;
  alertMsg       = '';

  // ─────────────────────────────────────────────────────────────

  ngOnInit() { this.loadServices(); }

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
    this.error   = '';
    this.svc.getMaterials(String(this.selectedServiceId)).subscribe({
      next: (res) => {
        this.materials = Array.isArray(res) ? res : (res?.data || []);
        this.loading   = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.message || 'No se pudieron cargar los materiales';
        this.cd.detectChanges();
      }
    });
  }

  // ── Toggle ─────────────────────────────────────────────────────
  openToggleModal(item: MaterialItem) {
    this.toggleTarget = item;
    this.showToggleModal = true;
    this.cd.detectChanges();
  }

  closeToggleModal() {
    this.showToggleModal = false;
    this.toggleTarget    = null;
    this.cd.detectChanges();
  }

  confirmToggle() {
    const item = this.toggleTarget;
    if (!item) return;
    this.toggling = true;
    this.svc.toggleMaterial(String(item.id)).subscribe({
      next: () => {
        this.toggling = false;
        this.closeToggleModal();
        this.loadMaterials();
      },
      error: (e) => {
        this.toggling = false;
        this.closeToggleModal();
        this.openAlert(e?.error?.message || 'No se pudo cambiar el estado');
      }
    });
  }

  // ── Edit ───────────────────────────────────────────────────────
  openEditModal(item: MaterialItem) {
    this.editTarget = item;
    this.editName   = item.name;
    this.editPrice  = Number(item.unit_price);
    this.editError  = '';
    this.showEditModal = true;
    this.cd.detectChanges();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editTarget    = null;
    this.editError     = '';
    this.cd.detectChanges();
  }

  confirmEdit() {
    const name  = this.editName.trim();
    const price = Number(this.editPrice);
    if (!name || Number.isNaN(price) || price < 0) {
      this.editError = 'Nombre y precio son obligatorios.';
      return;
    }
    const item = this.editTarget;
    if (!item) return;

    this.editSaving = true;
    this.editError  = '';
    this.svc.updateMaterial(String(item.id), { name, unit_price: price }).subscribe({
      next: () => {
        this.editSaving = false;
        this.editError  = '';
        this.cd.detectChanges();
        this.closeEditModal();
        this.loadMaterials();
      },
      error: (e) => {
        this.editSaving = false;
        this.editError  = e?.error?.message || 'No se pudo actualizar el material';
        this.cd.detectChanges();
      }
    });
  }

  // ── Create ─────────────────────────────────────────────────────
  openCreateModal() {
    this.newName      = '';
    this.newUnit      = 'unidad';
    this.newPrice     = null;
    this.newServiceId = this.selectedServiceId;
    this.createError  = '';
    this.showCreateModal = true;
    this.cd.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createError     = '';
    this.cd.detectChanges();
  }

  submitCreate() {
    const name  = this.newName.trim();
    const unit  = this.newUnit.trim();
    const price = Number(this.newPrice);

    if (!name) { this.createError = 'El nombre es obligatorio.'; return; }
    if (!unit) { this.createError = 'La unidad es obligatoria.'; return; }
    if (!this.newServiceId) { this.createError = 'Selecciona un servicio.'; return; }
    if (Number.isNaN(price) || price <= 0) { this.createError = 'Ingresa un precio válido mayor a 0.'; return; }

    this.creating    = true;
    this.createError = '';

    this.svc.createMaterial({
      service_type_id: String(this.newServiceId),
      name,
      unit_price: price,
      unit
    }).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreateModal();
        // Si el servicio recién creado es el que está seleccionado, recargamos
        if (String(this.newServiceId) === String(this.selectedServiceId)) {
          this.loadMaterials();
        }
      },
      error: (e) => {
        this.creating    = false;
        this.createError = e?.error?.message || 'No se pudo crear el material.';
        this.cd.detectChanges();
      }
    });
  }

  // ── Alert ──────────────────────────────────────────────────────
  openAlert(msg: string) {
    this.alertMsg      = msg;
    this.showAlertModal = true;
    this.cd.detectChanges();
  }

  closeAlert() {
    this.showAlertModal = false;
    this.alertMsg       = '';
    this.cd.detectChanges();
  }
}
