import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientOrdersService, ClientOrderDetail } from '../orders/orders.service';
import { ClientPaymentsService } from './payments.service';

@Component({
  selector: 'app-client-payment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-payment.component.html'
})
export class ClientPaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(ClientOrdersService);
  private paymentsService = inject(ClientPaymentsService);

  orderId: string | null = null;
  order: ClientOrderDetail | null = null;
  
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;

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
    this.ordersService.getOrderById(id).subscribe({
      next: (response) => {
        this.order = this.ordersService.unwrapResource(response);
        if (this.order?.status !== 'PENDING_PAYMENT') {
          this.error = 'Este pedido no está pendiente de pago.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el pedido.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  getAmountToPay(): number {
    if (!this.order) return 0;
    if (this.order.payment_condition === 'ADVANCE_50') {
      const advance = typeof this.order.advance_amount === 'number' ? this.order.advance_amount : Number(this.order.advance_amount ?? 0);
      return advance;
    }
    return this.ordersService.getOrderEstimatedPrice(this.order);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.error = 'Solo se permiten imágenes (jpg, png).';
        this.selectedFile = null;
        this.filePreview = null;
        return;
      }
      this.error = null;
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreview = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (!this.orderId || !this.selectedFile) return;

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    this.paymentsService.uploadPaymentCapture(this.orderId, this.selectedFile).subscribe({
      next: () => {
        this.success = 'Captura subida con éxito. Esperando validación del administrador.';
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/client/orders', this.orderId]);
        }, 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al subir la captura de pago.';
        this.isSubmitting = false;
        console.error(err);
      }
    });
  }
}
