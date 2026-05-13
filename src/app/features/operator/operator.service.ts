import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OperatorOrder {
  id: string;
  status: string;
  client?: any;
  service_type?: any;
  material?: any;
  budget_expires_at?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  files?: any[];
}

export interface CollectionResponse<T> {
  data: T[];
  total?: number;
}

export interface ResourceResponse<T> {
  data: T;
}

export interface GenericResponse {
  error?: boolean;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  private http = inject(HttpClient);

  getAssignedOrders(status?: string): Observable<CollectionResponse<OperatorOrder>> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<CollectionResponse<OperatorOrder>>('/api/operator/orders', { params });
  }

  getOrderById(orderId: string): Observable<ResourceResponse<OperatorOrder>> {
    return this.http.get<ResourceResponse<OperatorOrder>>(`/api/operator/orders/${orderId}`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/operator/orders/${orderId}/status`, { status });
  }

  updateOrderNotes(orderId: string, notes: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/operator/orders/${orderId}/notes`, { notes });
  }
}
