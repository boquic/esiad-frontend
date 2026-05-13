import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserClient {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  phone: string;
  is_frequent: boolean;
  completed_orders_count: number;
}

export interface UserOperator {
  id: string;
  user_id: string;
  user?: {
    first_name: string;
    last_name: string;
    dni: string;
    phone: string;
  };
  specialties?: any[];
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

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private http = inject(HttpClient);

  getClients(): Observable<CollectionResponse<UserClient>> {
    return this.http.get<CollectionResponse<UserClient>>('/api/admin/clients');
  }

  toggleFrequentClient(clientId: string, isFrequent: boolean): Observable<GenericResponse> {
    return this.http.patch<GenericResponse>(`/api/admin/clients/${clientId}/frequent`, { is_frequent: isFrequent });
  }

  getOperators(): Observable<CollectionResponse<UserOperator>> {
    return this.http.get<CollectionResponse<UserOperator>>('/api/admin/operators');
  }

  createOperator(data: any): Observable<GenericResponse> {
    return this.http.post<GenericResponse>('/api/admin/operators', data);
  }

  deleteOperator(operatorId: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`/api/admin/operators/${operatorId}`);
  }
}
