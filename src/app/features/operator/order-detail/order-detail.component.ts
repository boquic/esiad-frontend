import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService, OperatorOrder } from '../operator.service';

@Component({
  selector: 'app-operator-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-detail.component.html'
})
export class OperatorOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private operatorService = inject(OperatorService);

  orderId: string | null = null;
  order: OperatorOrder | null = null;
  
  isLoading = true;
  error: string | null = null;
  success: string | null = null;

  internalNotes = '';
  isSavingNotes = false;
  isChangingStatus = false;

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.error = 'No se proporcionó un ID de pedido.';
      this.isLoading = false;
    }
  }

  loadOrder(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.operatorService.getOrderById(id).subscribe({
      next: (response) => {
        this.order = response.data;
        this.internalNotes = this.order.notes || '';
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los detalles del pedido.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  saveNotes(): void {
    if (!this.orderId) return;
    this.isSavingNotes = true;
    this.success = null;
    this.error = null;

    this.operatorService.updateOrderNotes(this.orderId, this.internalNotes).subscribe({
      next: () => {
        this.success = 'Notas guardadas exitosamente.';
        this.isSavingNotes = false;
        if (this.order) {
          this.order.notes = this.internalNotes;
        }
      },
      error: (err) => {
        this.error = 'Error al guardar notas.';
        this.isSavingNotes = false;
        console.error(err);
      }
    });
  }

  markAsReady(): void {
    if (!this.orderId) return;
    if (!confirm('¿Estás seguro de marcar este pedido como LISTO? Esto notificará al cliente para que pase a recogerlo.')) {
      return;
    }

    this.isChangingStatus = true;
    this.success = null;
    this.error = null;

    this.operatorService.updateOrderStatus(this.orderId, 'READY').subscribe({
      next: () => {
        this.success = 'El pedido ha sido marcado como LISTO.';
        this.isChangingStatus = false;
        if (this.order) {
          this.order.status = 'READY';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cambiar el estado del pedido.';
        this.isChangingStatus = false;
        console.error(err);
      }
    });
  }
}
