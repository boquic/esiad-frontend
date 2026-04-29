import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MaterialDto = {
  id: string | number;
  name: string;
  price: number;
  is_active: boolean;
  serviceTypeId?: string | number;
};

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private base = '/api/materials';

  getMaterials(serviceTypeId: string): Observable<MaterialDto[]> {
    const params = new HttpParams().set('serviceTypeId', serviceTypeId);
    return this.http.get<MaterialDto[]>(this.base, { params });
  }

  toggleMaterial(id: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/toggle`, {});
  }

  updateMaterial(id: string, data: Partial<MaterialDto>): Observable<any> {
    return this.http.patch(`${this.base}/${id}`, data);
  }
}
