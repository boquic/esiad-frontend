import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OperatorOrder {
  id: string;
  status: string;
  quantity?: number | string | null;
  client_id?: string;
  operator_id?: string;
  service_type_id?: string;
  material_id?: string;
  budget_expires_at?: string;
  estimated_delivery_at?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  operator_notes?: string | null;
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
    pricing_model: string;
    required_specialty?: string;
  };
  material?: {
    id: string;
    name: string;
    unit?: string;
    unit_price?: number | string;
  };
  files?: Array<{
    id: string;
    order_id: string;
    file_url?: string;
    file_type: string;
    uploaded_at: string;
    download_url?: string;
  }>;
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
