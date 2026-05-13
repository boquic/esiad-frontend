import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminPayment {
  id: string;
  order_id: string;
  amount: number;
  payment_type: string;
  capture_url?: string;
  status: string;
  created_at: string;
  order?: any;
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
  first_name?: string;
  last_name?: string;
  specialties?: any[];
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
    // Assuming this endpoint exists based on earlier sprints to get list of operators
    return this.http.get<CollectionResponse<Operator>>('/api/operators');
  }

  assignOperatorToOrder(orderId: string, operatorId: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/admin/orders/${orderId}/assign`, { operator_id: operatorId });
  }
}
