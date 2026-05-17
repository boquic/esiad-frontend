import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MaterialDto = {
  id: string | number;
  name: string;
  unit_price: number | string;
  unit?: string | null;
  is_active: boolean;
  service_type?: {
    name?: string | null;
  } | null;
  serviceTypeId?: string | number;
};

export type CollectionResponse<T> = {
  data: T[];
  total?: number;
};

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private base = '/api/materials';

  getMaterials(serviceTypeId: string): Observable<CollectionResponse<MaterialDto>> {
    const params = new HttpParams().set('serviceTypeId', serviceTypeId);
    return this.http.get<CollectionResponse<MaterialDto>>(this.base, { params });
  }

  toggleMaterial(id: string): Observable<{ data: { id: string; is_active: boolean } }> {
    return this.http.patch<{ data: { id: string; is_active: boolean } }>(`${this.base}/${id}/toggle`, {});
  }

  updateMaterial(id: string, data: Partial<MaterialDto>): Observable<{ data: Partial<MaterialDto> }> {
    return this.http.patch<{ data: Partial<MaterialDto> }>(`${this.base}/${id}`, data);
  }

  createMaterial(data: { service_type_id: string; name: string; unit_price: number; unit: string }): Observable<{ data: MaterialDto }> {
    return this.http.post<{ data: MaterialDto }>(this.base, data);
  }

  deleteMaterial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
