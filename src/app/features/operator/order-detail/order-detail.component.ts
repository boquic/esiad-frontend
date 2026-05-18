import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService, OperatorOrder } from '../operator.service';

@Component({
  selector: 'app-operator-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-detail.component.html',
  styles: [`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(-10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-enter { animation: modalIn 0.2s ease-out; }
  `]
})
export class OperatorOrderDetailComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private operatorService = inject(OperatorService);

  orderId: string | null  = null;
  order: OperatorOrder | null = null;

  isLoading        = true;
  error: string | null    = null;
  success: string | null  = null;

  internalNotes    = '';
  isSavingNotes    = false;
  isChangingStatus = false;

  // ── Modal de confirmación "Marcar como LISTO" ──────────────────
  showReadyModal = false;

  openReadyModal():  void { this.showReadyModal = true;  }
  closeReadyModal(): void { this.showReadyModal = false; }

  // ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.error     = 'No se proporcionó un ID de pedido.';
      this.isLoading = false;
    }
  }

  loadOrder(id: string): void {
    this.isLoading = true;
    this.error     = null;

    this.operatorService.getOrderById(id).subscribe({
      next: (response) => {
        this.order        = (response?.data !== undefined ? response.data : response) as OperatorOrder;
        this.internalNotes = this.order?.operator_notes || this.order?.notes || '';
        this.isLoading    = false;
      },
      error: () => {
        this.error     = 'Error al cargar los detalles del pedido.';
        this.isLoading = false;
      }
    });
  }

  saveNotes(): void {
    if (!this.orderId) return;
    this.isSavingNotes = true;
    this.success       = null;
    this.error         = null;

    this.operatorService.updateOrderNotes(this.orderId, this.internalNotes).subscribe({
      next: () => {
        this.success       = 'Notas guardadas correctamente.';
        this.isSavingNotes = false;
        if (this.order) {
          this.order.operator_notes = this.internalNotes;
        }
      },
      error: () => {
        this.error         = 'No se pudieron guardar las notas.';
        this.isSavingNotes = false;
      }
    });
  }

  confirmMarkAsReady(): void {
    if (!this.orderId) return;

    this.isChangingStatus = true;
    this.success          = null;
    this.error            = null;
    this.closeReadyModal();

    this.operatorService.updateOrderStatus(this.orderId, 'READY').subscribe({
      next: () => {
        this.success          = 'El pedido ha sido marcado como LISTO para recoger.';
        this.isChangingStatus = false;
        if (this.order) {
          this.order.status = 'READY';
        }
      },
      error: (err) => {
        this.error            = err?.error?.message || 'No se pudo cambiar el estado del pedido.';
        this.isChangingStatus = false;
      }
    });
  }
}
