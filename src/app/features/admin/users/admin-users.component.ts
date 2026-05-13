import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService, UserClient, UserOperator } from './admin-users.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(AdminUsersService);

  activeTab: 'operators' | 'clients' = 'operators';
  
  clients: UserClient[] = [];
  operators: UserOperator[] = [];

  isLoading = true;
  error: string | null = null;
  success: string | null = null;

  // New Operator Form
  showCreateModal = false;
  newOperator = {
    dni: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    specialties: {
      LASER: false,
      PLOTTING: false,
      PRINTING_3D: false,
      MODEL: false
    }
  };
  isSubmitting = false;

  ngOnInit(): void {
    this.loadData();
  }

  setTab(tab: 'operators' | 'clients'): void {
    this.activeTab = tab;
    this.error = null;
    this.success = null;
  }

  loadData(): void {
    this.isLoading = true;
    this.usersService.getOperators().subscribe({
      next: (res) => {
        this.operators = res.data || [];
        this.loadClients();
      },
      error: (err) => {
        this.error = 'Error al cargar operarios.';
        this.isLoading = false;
      }
    });
  }

  loadClients(): void {
    this.usersService.getClients().subscribe({
      next: (res) => {
        this.clients = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar clientes.';
        this.isLoading = false;
      }
    });
  }

  toggleFrequent(client: UserClient): void {
    const newValue = !client.is_frequent;
    this.usersService.toggleFrequentClient(client.id, newValue).subscribe({
      next: () => {
        client.is_frequent = newValue;
        this.success = `Cliente actualizado exitosamente.`;
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al actualizar cliente.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  deleteOperator(operator: UserOperator): void {
    if (!confirm('¿Estás seguro de eliminar este operario? Si tiene pedidos asignados en proceso no se podrá eliminar.')) return;
    
    this.usersService.deleteOperator(operator.id).subscribe({
      next: () => {
        this.success = 'Operario eliminado exitosamente.';
        this.loadData();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al eliminar operario (puede tener pedidos en proceso).';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  openCreateModal(): void {
    this.newOperator = {
      dni: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      specialties: { LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false }
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateOperator(): void {
    const specs = Object.keys(this.newOperator.specialties).filter(k => (this.newOperator.specialties as any)[k]);
    if (specs.length === 0) {
      this.error = 'Debe seleccionar al menos una especialidad.';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    const payload = {
      ...this.newOperator,
      specialties: specs
    };

    this.isSubmitting = true;
    this.usersService.createOperator(payload).subscribe({
      next: () => {
        this.success = 'Operario creado exitosamente.';
        this.isSubmitting = false;
        this.closeCreateModal();
        this.loadData();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear operario.';
        this.isSubmitting = false;
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  getSpecialtiesLabel(specialties?: any[]): string {
    if (!specialties || specialties.length === 0) return 'Sin especialidades';
    return specialties.map(s => {
      const name = s.specialty || s;
      switch (name) {
        case 'LASER': return 'Láser';
        case 'PLOTTING': return 'Ploteo';
        case 'PRINTING_3D': return 'Impresión 3D';
        case 'MODEL': return 'Maquetas';
        default: return name;
      }
    }).join(', ');
  }
}
