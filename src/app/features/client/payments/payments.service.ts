import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentResponse {
  error?: boolean;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ClientPaymentsService {
  private http = inject(HttpClient);

  uploadPaymentCapture(orderId: string, file: File): Observable<PaymentResponse> {
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('capture', file);

    return this.http.post<PaymentResponse>('/api/payments', formData);
  }
}
