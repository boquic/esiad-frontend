import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AdminUsersService, UserClient, UserOperator, UpdateOperatorPayload } from './admin-users.service';

type Specialty = 'LASER' | 'PLOTTING' | 'PRINTING_3D' | 'MODEL';

const SPECIALTY_LABELS: Record<Specialty, string> = {
  LASER:       'Corte Laser',
  PLOTTING:    'Ploteo',
  PRINTING_3D: 'Impresion 3D',
  MODEL:       'Maquetas'
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  private cdr          = inject(ChangeDetectorRef);

  activeTab: 'operators' | 'clients' = 'operators';

  clients: UserClient[]     = [];
  operators: UserOperator[] = [];

  isLoading = true;
  error: string | null   = null;
  success: string | null = null;

  readonly specialties: Specialty[] = ['LASER', 'PLOTTING', 'PRINTING_3D', 'MODEL'];
  readonly specialtyLabel = (s: Specialty) => SPECIALTY_LABELS[s];

  // -- Modal crear operario ------------------------------------------
  showCreateModal         = false;
  showNewOperatorPassword = false;
  creating                = false;
  createError             = '';

  newOperator = {
    dni:        '',
    first_name: '',
    last_name:  '',
    phone:      '',
    password:   '',
    specialties: { LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false } as Record<Specialty, boolean>
  };

  // -- Modal editar operario -----------------------------------------
  showEditModal = false;
  editing       = false;
  editError     = '';
  editTarget: UserOperator | null = null;

  editOperator = {
    first_name:  '',
    last_name:   '',
    specialties: { LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false } as Record<Specialty, boolean>
  };

  // -- Toggle activo/inactivo ----------------------------------------
  togglingId: string | null = null;

  // -- Modal eliminar operario ---------------------------------------
  showDeleteModal = false;
  deleteTarget: UserOperator | null = null;
  deleting        = false;
  deleteError     = '';

  // -----------------------------------------------------------------

  ngOnInit(): void { this.loadData(); }

  setTab(tab: 'operators' | 'clients'): void {
    this.activeTab = tab;
    this.error   = null;
    this.success = null;
  }

  // Carga inicial: ambas listas en paralelo
  loadData(): void {
    this.isLoading = true;
    this.error     = null;

    forkJoin({
      operators: this.usersService.getOperators(),
      clients:   this.usersService.getClients()
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        // Forzar deteccion de cambios para garantizar re-render
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ operators, clients }) => {
        this.operators = operators.data || [];
        this.clients   = clients.data   || [];
      },
      error: () => {
        this.error = 'Error al cargar los usuarios. Verifica tu conexion o permisos.';
      }
    });
  }

  // Recarga solo operarios (para despues de crear)
  private reloadOperators(): void {
    this.usersService.getOperators().subscribe({
      next: (res) => {
        this.operators = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  // -- Crear operario ------------------------------------------------
  openCreateModal(): void {
    this.newOperator = {
      dni: '', first_name: '', last_name: '', phone: '', password: '',
      specialties: { LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false }
    };
    this.createError             = '';
    this.showNewOperatorPassword = false;
    this.showCreateModal         = true;
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
    if (!phone.trim())      { this.createError = 'El telefono es obligatorio.'; return; }
    if (!password.trim())   { this.createError = 'La contrasena es obligatoria.'; return; }

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
    }).pipe(
      finalize(() => this.creating = false)
    ).subscribe({
      next: () => {
        this.closeCreateModal();
        this.success = 'Operario creado exitosamente.';
        this.reloadOperators();
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        this.createError = err?.name === 'TimeoutError'
          ? 'La operacion tardo demasiado. Intenta nuevamente.'
          : (err?.error?.message || 'No se pudo crear el operario.');
      }
    });
  }

  // -- Editar operario -----------------------------------------------
  openEditModal(op: UserOperator): void {
    this.editTarget = op;
    this.editError  = '';

    const specs: Record<Specialty, boolean> = {
      LASER: false, PLOTTING: false, PRINTING_3D: false, MODEL: false
    };
    if (op.specialties) {
      op.specialties.forEach((s: any) => {
        const key = (typeof s === 'string' ? s : s?.specialty) as Specialty;
        if (key && key in specs) specs[key] = true;
      });
    }

    this.editOperator = {
      first_name:  op.user?.first_name ?? '',
      last_name:   op.user?.last_name  ?? '',
      specialties: specs
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editTarget    = null;
    this.editError     = '';
    this.editing       = false;
  }

  submitEditOperator(): void {
    const { first_name, last_name } = this.editOperator;
    if (!first_name.trim()) { this.editError = 'El nombre es obligatorio.'; return; }
    if (!last_name.trim())  { this.editError = 'El apellido es obligatorio.'; return; }

    const selectedSpecs = this.specialties.filter(s => this.editOperator.specialties[s]);
    if (selectedSpecs.length === 0) {
      this.editError = 'Debes seleccionar al menos una especialidad.';
      return;
    }

    if (!this.editTarget) return;

    this.editing   = true;
    this.editError = '';

    const payload: UpdateOperatorPayload = {
      first_name:  first_name.trim(),
      last_name:   last_name.trim(),
      specialties: selectedSpecs
    };

    const targetId = this.editTarget.id;

    this.usersService.updateOperator(targetId, payload).pipe(
      finalize(() => this.editing = false)
    ).subscribe({
      next: () => {
        // Actualizar localmente sin recargar toda la lista
        const idx = this.operators.findIndex(o => o.id === targetId);
        if (idx !== -1 && this.operators[idx].user) {
          this.operators[idx].user!.first_name = first_name.trim();
          this.operators[idx].user!.last_name  = last_name.trim();
          this.operators[idx].specialties      = selectedSpecs;
          // Crear nueva referencia de array para que Angular detecte el cambio
          this.operators = [...this.operators];
        }
        this.closeEditModal();
        this.success = 'Operario actualizado exitosamente.';
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        this.editError = err?.name === 'TimeoutError'
          ? 'La operacion tardo demasiado. Intenta nuevamente.'
          : (err?.error?.message || 'No se pudo actualizar el operario.');
      }
    });
  }

  // -- Toggle activo / inactivo (actualiza solo el item local) -------
  toggleOperatorActive(op: UserOperator): void {
    if (this.togglingId === op.id) return;
    this.togglingId = op.id;

    this.usersService.toggleOperatorActive(op.id).pipe(
      finalize(() => this.togglingId = null)
    ).subscribe({
      next: (res) => {
        const updatedActive = res?.data?.is_active ?? !op.is_active;
        // Mutar solo el item afectado y crear nueva referencia de array
        const idx = this.operators.findIndex(o => o.id === op.id);
        if (idx !== -1) {
          this.operators[idx] = { ...this.operators[idx], is_active: updatedActive };
          this.operators = [...this.operators];
        }
        this.success = `Operario ${updatedActive ? 'activado' : 'desactivado'} correctamente.`;
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        const msg = err?.name === 'TimeoutError'
          ? 'La operacion tardo demasiado. Intenta nuevamente.'
          : (err?.error?.message || 'No se pudo cambiar el estado del operario.');
        this.error = msg;
        setTimeout(() => this.error = null, 4000);
      }
    });
  }

  // -- Eliminar operario (elimina del array local) -------------------
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

    this.usersService.deleteOperator(op.id).pipe(
      finalize(() => this.deleting = false)
    ).subscribe({
      next: () => {
        // Eliminar del array local sin recargar
        this.operators = this.operators.filter(o => o.id !== op.id);
        this.closeDeleteModal();
        this.success = 'Operario eliminado exitosamente.';
        setTimeout(() => this.success = null, 4000);
      },
      error: (err) => {
        this.deleteError = err?.name === 'TimeoutError'
          ? 'La operacion tardo demasiado. Intenta nuevamente.'
          : (err?.error?.message || 'No se pudo eliminar el operario.');
      }
    });
  }

  // -- Cliente frecuente ---------------------------------------------
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

  // -- Helpers -------------------------------------------------------
  trackByOperatorId(_: number, op: UserOperator): string { return op.id; }
  trackByClientId(_: number, c: UserClient): string      { return c.id; }

  getSpecialtiesLabel(specialties?: any[]): string {
    if (!specialties || specialties.length === 0) return '-';
    return specialties.map(s => {
      const key = (s.specialty || s) as Specialty;
      return SPECIALTY_LABELS[key] ?? key;
    }).join(', ');
  }

  operatorFullName(op: UserOperator): string {
    return `${op.user?.first_name ?? ''} ${op.user?.last_name ?? ''}`.trim() || '-';
  }
}
