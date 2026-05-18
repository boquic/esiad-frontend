import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUsersService, UserClient, UserOperator } from './admin-users.service';

type Specialty = 'LASER' | 'PLOTTING' | 'PRINTING_3D' | 'MODEL';

const SPECIALTY_LABELS: Record<Specialty, string> = {
  LASER:       'Corte Láser',
  PLOTTING:    'Ploteo',
  PRINTING_3D: 'Impresión 3D',
  MODEL:       'Maquetas'
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styles: [`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-enter { animation: modalIn 0.2s ease-out; }
  `]
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(AdminUsersService);

  activeTab: 'operators' | 'clients' = 'operators';

  clients: UserClient[]   = [];
  operators: UserOperator[] = [];

  isLoading = true;
  error: string | null   = null;
  success: string | null = null;

  readonly specialties: Specialty[] = ['LASER', 'PLOTTING', 'PRINTING_3D', 'MODEL'];
  readonly specialtyLabel = (s: Specialty) => SPECIALTY_LABELS[s];

  // ── Modal crear operario ───────────────────────────────────────
  showCreateModal           = false;
  showNewOperatorPassword   = false;
  creating                  = false;
  createError               = '';

  newOperator = {
    dni:        '',
    first_name: '',
    last_name:  '',
    phone:      '',
    password:   '',
    specialties: { LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false } as Record<Specialty, boolean>
  };

  // ── Modal eliminar operario ────────────────────────────────────
  showDeleteModal  = false;
  deleteTarget: UserOperator | null = null;
  deleting         = false;
  deleteError      = '';

  // ─────────────────────────────────────────────────────────────

  ngOnInit(): void { this.loadData(); }

  setTab(tab: 'operators' | 'clients'): void {
    this.activeTab = tab;
    this.error   = null;
    this.success = null;
  }

  loadData(): void {
    this.isLoading = true;
    this.usersService.getOperators().subscribe({
      next: (res) => {
        this.operators = res.data || [];
        this.loadClients();
      },
      error: () => {
        this.error     = 'Error al cargar operarios.';
        this.isLoading = false;
      }
    });
  }

  loadClients(): void {
    this.usersService.getClients().subscribe({
      next: (res) => {
        this.clients   = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.error     = 'Error al cargar clientes.';
        this.isLoading = false;
      }
    });
  }

  // ── Crear operario ─────────────────────────────────────────────
  openCreateModal(): void {
    this.newOperator = {
      dni: '', first_name: '', last_name: '', phone: '', password: '',
      specialties: { LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false }
    };
    this.createError              = '';
    this.showNewOperatorPassword  = false;
    this.showCreateModal          = true;
  }

  closeCreateModal(): void {
    this.showCreateModal         = false;
    this.createError             = '';
    this.showNewOperatorPassword = false;
  }

  submitCreateOperator(): void {
    const { dni, first_name, last_name, phone, password } = this.newOperator;

    if (!first_name.trim()) { this.createError = 'El nombre es obligatorio.'; return; }
    if (!last_name.trim())  { this.createError = 'El apellido es obligatorio.'; return; }
    if (!dni.trim())        { this.createError = 'El DNI es obligatorio.'; return; }
    if (!phone.trim())      { this.createError = 'El teléfono es obligatorio.'; return; }
    if (!password.trim())   { this.createError = 'La contraseña es obligatoria.'; return; }

    const selectedSpecs = this.specialties.filter(s => this.newOperator.specialties[s]);
    if (selectedSpecs.length === 0) {
      this.createError = 'Debes seleccionar al menos una especialidad.';
      return;
    }

    this.creating    = true;
    this.createError = '';

    this.usersService.createOperator({
      dni, first_name, last_name, phone, password,
      specialties: selectedSpecs
    }).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreateModal();
        this.success = 'Operario creado exitosamente.';
        this.loadData();
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        this.creating    = false;
        this.createError = err?.error?.message || 'No se pudo crear el operario.';
      }
    });
  }

  // ── Eliminar operario ──────────────────────────────────────────
  openDeleteModal(op: UserOperator): void {
    this.deleteTarget    = op;
    this.deleteError     = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteTarget    = null;
    this.deleteError     = '';
  }

  confirmDelete(): void {
    const op = this.deleteTarget;
    if (!op) return;
    this.deleting    = true;
    this.deleteError = '';

    this.usersService.deleteOperator(op.id).subscribe({
      next: () => {
        this.deleting = false;
        this.closeDeleteModal();
        this.success = 'Operario eliminado exitosamente.';
        this.loadData();
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        this.deleting    = false;
        this.deleteError = err?.error?.message || 'No se pudo eliminar el operario.';
      }
    });
  }

  // ── Cliente frecuente ──────────────────────────────────────────
  toggleFrequent(client: UserClient): void {
    const newValue = !client.is_frequent;
    this.usersService.toggleFrequentClient(client.id, newValue).subscribe({
      next: () => {
        client.is_frequent = newValue;
        this.success = 'Cliente actualizado correctamente.';
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al actualizar cliente.';
        setTimeout(() => this.error = null, 4000);
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  getSpecialtiesLabel(specialties?: any[]): string {
    if (!specialties || specialties.length === 0) return '—';
    return specialties.map(s => {
      const key = (s.specialty || s) as Specialty;
      return SPECIALTY_LABELS[key] ?? key;
    }).join(', ');
  }

  operatorFullName(op: UserOperator): string {
    return `${op.user?.first_name ?? ''} ${op.user?.last_name ?? ''}`.trim() || '—';
  }
}
