import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './services-admin.component.html'
})
export class ServicesAdminComponent {
  private svc = inject(ServicesService);

  services: ServiceItem[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.svc.getServices().subscribe({
      next: (res) => {
        this.services = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No se pudieron cargar los servicios';
      }
    });
  }

  toggle(item: ServiceItem) {
    const confirmMsg = item.is_active ? `Desactivar ${item.name}?` : `Activar ${item.name}?`;
    if (!confirm(confirmMsg)) return;

    this.svc.toggleService(String(item.id)).subscribe({
      next: () => this.load(),
      error: (err) => alert(err?.error?.message || 'No se pudo cambiar el estado')
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
}
