import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ServiceDto = {
  id: string | number;
  name: string;
  is_active: boolean;
  [k: string]: unknown;
};

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private http = inject(HttpClient);
  private base = '/api/services';

  getServices(): Observable<ServiceDto[]> {
    return this.http.get<ServiceDto[]>(this.base);
  }

  toggleService(id: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/toggle`, {});
  }

  updateService(id: string, data: Partial<ServiceDto>): Observable<any> {
    return this.http.patch(`${this.base}/${id}`, data);
  }
}
