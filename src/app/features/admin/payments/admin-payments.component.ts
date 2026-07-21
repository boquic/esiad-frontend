import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService, AdminPayment, Operator } from './admin-payments.service';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-payments.component.html'
})
export class AdminPaymentsComponent implements OnInit, OnDestroy {
  private paymentsService = inject(AdminPaymentsService);

  payments: AdminPayment[] = [];
  operators: Operator[] = [];

  isLoading = true;
  error: string | null = null;
  success: string | null = null;

  selectedPayment: AdminPayment | null = null;
  rejectComment = '';
  showRejectModal = false;

  selectedOrderForAssignment: string | null = null;
  selectedOperatorId = '';
  showAssignModal = false;

  // HU-21: polling automático de la bandeja de pagos (alternativa simple a
  // WebSockets). Configurable: ajustar este valor para cambiar la frecuencia
  // (20-30s).
  private readonly pollIntervalMs = 25000;
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadPendingPayments();
    this.loadOperators();

    // HU-21/BUG-09 - Pruebas #9, #18: refresco periódico silencioso para que
    // los pagos ya resueltos desaparezcan de la bandeja sin necesidad de F5.
    this.pollHandle = setInterval(() => this.loadPendingPayments(true), this.pollIntervalMs);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  // HU-21/BUG-02/04/09: `silent=true` refresca la bandeja desde el servidor
  // sin mostrar el spinner de página completa (para el polling automático).
  loadPendingPayments(silent = false): void {
    if (!silent) this.isLoading = true;
    this.paymentsService.getPendingPayments().subscribe({
      next: (response) => {
        this.payments = Array.isArray(response) ? response : (response?.data || []);
        if (!silent) this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || `Error al cargar pagos pendientes: ${err.status} ${err.statusText || err.message || ''}`;
        if (!silent) this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadOperators(): void {
    this.paymentsService.getOperators().subscribe({
      next: (response) => {
        this.operators = Array.isArray(response) ? response : (response?.data || []);
      },
      error: (err) => {
        console.error('Error al cargar operarios:', err);
      }
    });
  }

  approvePayment(payment: AdminPayment): void {
    if (!confirm('¿Estás seguro de aprobar este pago? El pedido pasará a EN PROCESO.')) return;
    
    this.paymentsService.approvePayment(payment.id).subscribe({
      next: () => {
        this.success = 'Pago aprobado exitosamente.';
        this.loadPendingPayments();
        this.openAssignModal(payment.order_id);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al aprobar el pago.';
      }
    });
  }

  openRejectModal(payment: AdminPayment): void {
    this.selectedPayment = payment;
    this.rejectComment = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedPayment = null;
    this.rejectComment = '';
  }

  submitReject(): void {
    if (!this.selectedPayment || !this.rejectComment.trim()) return;

    this.paymentsService.rejectPayment(this.selectedPayment.id, this.rejectComment).subscribe({
      next: () => {
        this.success = 'Pago rechazado exitosamente.';
        this.closeRejectModal();
        this.loadPendingPayments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al rechazar el pago.';
      }
    });
  }

  openAssignModal(orderId: string): void {
    this.selectedOrderForAssignment = orderId;
    this.selectedOperatorId = '';
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedOrderForAssignment = null;
    this.selectedOperatorId = '';
  }

  submitAssign(): void {
    if (!this.selectedOrderForAssignment || !this.selectedOperatorId) return;

    this.paymentsService.assignOperatorToOrder(this.selectedOrderForAssignment, this.selectedOperatorId).subscribe({
      next: () => {
        this.success = 'Operario asignado exitosamente.';
        this.closeAssignModal();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al asignar operario.';
      }
    });
  }

  getOperatorName(operator: Operator): string {
    if (operator.user) {
      return `${operator.user.first_name || ''} ${operator.user.last_name || ''}`.trim();
    }
    return operator.first_name ? `${operator.first_name} ${operator.last_name || ''}`.trim() : operator.id;
  }
}
