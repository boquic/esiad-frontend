import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  specialties?: string[];
  user?: {
    first_name?: string;
    last_name?: string;
    dni?: string;
    phone?: string;
  };
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
    return this.http.get<any>('/api/admin/operators').pipe(
      map(res => ({
        data: Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []),
        total: res?.total
      }))
    );
  }

  assignOperatorToOrder(orderId: string, operatorId: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/admin/orders/${orderId}/assign`, { operator_id: operatorId });
  }
}
