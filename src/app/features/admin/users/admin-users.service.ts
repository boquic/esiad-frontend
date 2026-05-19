import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

const REQUEST_TIMEOUT_MS = 8000;

export interface UserClient {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  phone: string;
  is_frequent: boolean;
  completed_orders_count: number;
  role: string;
  created_at: string;
}

export interface UserOperator {
  id: string;
  user_id: string;
  is_active: boolean;
  user?: {
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
  };
  specialties?: string[];
}

export interface UpdateOperatorPayload {
  first_name?: string;
  last_name?:  string;
  specialties?: string[];
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
export class AdminUsersService {
  private http = inject(HttpClient);

  getClients(): Observable<CollectionResponse<UserClient>> {
    return this.http.get<any>('/api/admin/clients').pipe(
      map(res => ({
        data: Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []),
        total: res?.total
      })),
      catchError(() => of({ data: [] }))
    );
  }

  toggleFrequentClient(clientId: string, isFrequent: boolean): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(
      `/api/admin/clients/${clientId}/frequent`,
      { is_frequent: isFrequent }
    ).pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  getOperators(): Observable<CollectionResponse<UserOperator>> {
    return this.http.get<any>('/api/admin/operators').pipe(
      map(res => ({
        data: Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []),
        total: res?.total
      })),
      catchError(() => of({ data: [] }))
    );
  }

  createOperator(data: any): Observable<GenericResponse> {
    return this.http.post<GenericResponse>('/api/admin/operators', data).pipe(
      timeout(REQUEST_TIMEOUT_MS)
    );
  }

  // Solo los campos confirmados por el contrato API
  updateOperator(operatorId: string, payload: UpdateOperatorPayload): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(
      `/api/admin/operators/${operatorId}`,
      payload
    ).pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  // Sigue el patron de /api/services/:id/toggle y /api/materials/:id/toggle
  toggleOperatorActive(operatorId: string): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(
      `/api/admin/operators/${operatorId}/toggle`,
      {}
    ).pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  deleteOperator(operatorId: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`/api/admin/operators/${operatorId}`).pipe(
      timeout(REQUEST_TIMEOUT_MS)
    );
  }
}
