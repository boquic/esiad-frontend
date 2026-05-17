import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ServiceDto = {
  id: string | number;
  name: string;
  pricing_model: string;
  is_active: boolean;
  created_at?: string;
  [k: string]: unknown;
};

export type CollectionResponse<T> = {
  data: T[];
  total?: number;
};

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private http = inject(HttpClient);
  private base = '/api/services';

  getServices(): Observable<CollectionResponse<ServiceDto>> {
    return this.http.get<CollectionResponse<ServiceDto>>(`${this.base}?all=true`);
  }

  toggleService(id: string): Observable<{ data: { id: string; is_active: boolean } }> {
    return this.http.patch<{ data: { id: string; is_active: boolean } }>(`${this.base}/${id}/toggle`, {});
  }

  updateService(id: string, data: Partial<ServiceDto>): Observable<{ data: Partial<ServiceDto> }> {
    return this.http.patch<{ data: Partial<ServiceDto> }>(`${this.base}/${id}`, data);
  }

  createService(data: { name: string; pricing_model: string }): Observable<{ data: ServiceDto }> {
    return this.http.post<{ data: ServiceDto }>(this.base, data);
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
