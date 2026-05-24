import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ServicesService } from './services.service';

type ServiceItem = {
  id: string | number;
  name: string;
  is_active: boolean;
  [k: string]: unknown;
};

@Component({
  selector: 'app-services-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './services-admin.component.html',
  styles: [`
    @keyframes togglePulse {
      0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(58,143,139,0.4); }
      45%  { transform: scale(1.13); box-shadow: 0 0 0 6px rgba(58,143,139,0.15); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(58,143,139,0); }
    }
    .toggle-animating {
      animation: togglePulse 0.38s ease-out forwards;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-enter {
      animation: modalIn 0.2s ease-out;
    }
  `]
})
export class ServicesAdminComponent {
  private svc = inject(ServicesService);

  services  = signal<ServiceItem[]>([]);
  loading   = signal(false);
  error     = signal('');

  // ── Modal crear ────────────────────────────────────────────────
  showCreateModal = signal(false);
  creating        = signal(false);
  createError     = signal('');
  newName         = '';
  newPricingModel = 'PER_UNIT';

  // ── Modal eliminar ─────────────────────────────────────────────
  showDeleteModal = signal(false);
  deleteTarget    = signal<ServiceItem | null>(null);
  deleting        = signal(false);

  // ── Modal editar ───────────────────────────────────────────────
  showEditModal = signal(false);
  editTarget    = signal<ServiceItem | null>(null);
  editName      = '';
  editError     = signal('');
  editSaving    = signal(false);

  // ── Modal alerta genérica ──────────────────────────────────────
  showAlertModal = signal(false);
  alertMessage   = signal('');

  // ── Toggle animation ───────────────────────────────────────────
  private _togglingIds = signal<Set<string | number>>(new Set());

  isToggling(id: string | number): boolean {
    return this._togglingIds().has(id);
  }

  // ──────────────────────────────────────────────────────────────

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getServices().subscribe({
      next: (res) => {
        this.services.set(res?.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'No se pudieron cargar los servicios');
      }
    });
  }

  // ── Toggle ─────────────────────────────────────────────────────
  toggle(item: ServiceItem) {
    this._togglingIds.update(ids => new Set([...ids, item.id]));

    this.svc.toggleService(String(item.id)).subscribe({
      next: (res) => {
        const updatedIsActive = res?.data?.is_active ?? !item.is_active;
        this.services.update(list =>
          list.map(s => s.id === item.id ? { ...s, is_active: updatedIsActive } : s)
        );
        setTimeout(() => {
          this._togglingIds.update(ids => {
            const next = new Set(ids);
            next.delete(item.id);
            return next;
          });
        }, 420);
      },
      error: (err) => {
        this._togglingIds.update(ids => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.openAlert(err?.error?.message || 'No se pudo cambiar el estado');
      }
    });
  }

  // ── Delete ─────────────────────────────────────────────────────
  openDeleteModal(item: ServiceItem) {
    this.deleteTarget.set(item);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
  }

  confirmDelete() {
    const item = this.deleteTarget();
    if (!item) return;
    this.deleting.set(true);

    this.svc.deleteService(String(item.id)).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.openAlert(err?.error?.message || 'No se pudo eliminar el servicio');
      }
    });
  }

  // ── Edit ───────────────────────────────────────────────────────
  openEditModal(item: ServiceItem) {
    this.editTarget.set(item);
    this.editName = item.name;
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editTarget.set(null);
    this.editError.set('');
  }

  confirmEdit() {
    const trimmed = this.editName.trim();
    if (!trimmed) {
      this.editError.set('El nombre no puede estar vacío.');
      return;
    }
    const item = this.editTarget();
    if (!item) return;

    this.editSaving.set(true);
    this.editError.set('');

    this.svc.updateService(String(item.id), { name: trimmed }).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.closeEditModal();
        this.load();
      },
      error: (err) => {
        this.editSaving.set(false);
        this.editError.set(err?.error?.message || 'No se pudo actualizar el servicio');
      }
    });
  }

  // ── Alert ──────────────────────────────────────────────────────
  openAlert(msg: string) {
    this.alertMessage.set(msg);
    this.showAlertModal.set(true);
  }

  closeAlert() {
    this.showAlertModal.set(false);
    this.alertMessage.set('');
  }

  // ── Create ─────────────────────────────────────────────────────
  openCreateModal() {
    this.newName = '';
    this.newPricingModel = 'PER_UNIT';
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitCreate() {
    const name = this.newName.trim();
    if (!name) {
      this.createError.set('El nombre es obligatorio.');
      return;
    }

    this.creating.set(true);
    this.createError.set('');

    this.svc.createService({ name, pricing_model: this.newPricingModel }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateModal.set(false);
        this.load();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message || 'No se pudo crear el servicio.');
      }
    });
  }
}
