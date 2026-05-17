import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, FormsModule, HttpClientModule, RouterLink],
  templateUrl: './services-admin.component.html'
})
export class ServicesAdminComponent {
  private svc = inject(ServicesService);

  services = signal<ServiceItem[]>([]);
  loading = signal(false);
  error = signal('');

  // Modal crear servicio
  showCreateModal = signal(false);
  creating = signal(false);
  createError = signal('');
  newName = '';
  newPricingModel = 'PER_UNIT';

  ngOnInit() {
    this.load();
  }

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

  toggle(item: ServiceItem) {
    this.svc.toggleService(String(item.id)).subscribe({
      next: (res) => {
        // Actualizar solo ese item en el array local, sin recargar toda la lista
        const updatedIsActive = res?.data?.is_active ?? !item.is_active;
        this.services.update(list =>
          list.map(s => s.id === item.id ? { ...s, is_active: updatedIsActive } : s)
        );
      },
      error: (err) => alert(err?.error?.message || 'No se pudo cambiar el estado')
    });
  }

  delete(item: ServiceItem) {
    if (!confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;

    this.svc.deleteService(String(item.id)).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'No se pudo eliminar el servicio')
    });
  }

  edit(item: ServiceItem) {
    const newName = prompt('Nuevo nombre de servicio', item.name);
    if (newName == null) return;
    const trimmed = String(newName).trim();
    if (!trimmed) return alert('Nombre inválido');

    this.svc.updateService(String(item.id), { name: trimmed }).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'No se pudo actualizar el servicio')
    });
  }

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
