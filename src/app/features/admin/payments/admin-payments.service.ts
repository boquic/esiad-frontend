import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminPayment {
  id: string;
  order_id: string;
  amount: number | string;
  payment_type: string;
  capture_url?: string;
  status: string;
  admin_comment?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  order?: {
    id: string;
    client?: {
      id: string;
      first_name: string;
      last_name: string;
      dni: string;
      phone: string;
    };
    service_type?: {
      id: string;
      name: string;
    };
  };
}

export interface CollectionResponse<T> {
  data: T[];
  total?: number;
}

export interface GenericResponse {
  error?: boolean;
  message?: string;
  data?: any;
}

export interface Operator {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  specialties?: string[];
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPaymentsService {
  private http = inject(HttpClient);

  getPendingPayments(): Observable<CollectionResponse<AdminPayment>> {
    return this.http.get<CollectionResponse<AdminPayment>>('/api/admin/payments/pending');
  }

  approvePayment(paymentId: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/admin/payments/${paymentId}/approve`, {});
  }

  rejectPayment(paymentId: string, adminComment: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/admin/payments/${paymentId}/reject`, { admin_comment: adminComment });
  }

  getOperators(): Observable<CollectionResponse<Operator>> {
    // NOTE: This endpoint is not documented in API_CONTRACT.md but used by the application
    return this.http.get<CollectionResponse<Operator>>('/api/operators');
  }

  assignOperatorToOrder(orderId: string, operatorId: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/admin/orders/${orderId}/assign`, { operator_id: operatorId });
  }
}
