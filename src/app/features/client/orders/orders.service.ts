import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PricingModel =
  | 'FIXED'
  | 'PER_UNIT'
  | 'PER_AREA'
  | 'PER_LINEAR_METER'
  | 'PER_HOUR'
  | 'PER_VOLUME'
  | 'UNKNOWN';

export type ServiceOption = {
  id: string | number;
  name: string;
  is_active?: boolean;
  pricing_model?: string | null;
  pricingModel?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

export type MaterialOption = {
  id: string | number;
  name: string;
  price?: number | string | null;
  unit_price?: number | string | null;
  unitPrice?: number | string | null;
  unit?: string | null;
  is_active?: boolean;
  serviceTypeId?: string | number | null;
  [key: string]: unknown;
};

type CollectionResponse<T> = T[] | { data?: T[] | null; total?: number } | { data?: T | null };

@Injectable({ providedIn: 'root' })
export class ClientOrdersService {
  private http = inject(HttpClient);

  getServices(): Observable<CollectionResponse<ServiceOption>> {
    return this.http.get<CollectionResponse<ServiceOption>>('/api/services');
  }

  getMaterials(serviceTypeId: string): Observable<CollectionResponse<MaterialOption>> {
    const params = new HttpParams().set('serviceTypeId', serviceTypeId);
    return this.http.get<CollectionResponse<MaterialOption>>('/api/materials', { params });
  }

  normalizePricingModel(service: ServiceOption | null | undefined): PricingModel {
    const rawValue = service?.pricing_model ?? service?.pricingModel;
    const normalized = String(rawValue ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

    switch (normalized) {
      case 'FIXED':
      case 'FLAT':
      case 'FLAT_RATE':
        return 'FIXED';
      case 'PER_UNIT':
      case 'UNIT':
      case 'BY_UNIT':
        return 'PER_UNIT';
      case 'PER_AREA':
      case 'AREA':
      case 'PER_M2':
      case 'PER_SQUARE_METER':
      case 'SQUARE_METER':
        return 'PER_AREA';
      case 'PER_LINEAR_METER':
      case 'LINEAR_METER':
      case 'PER_METER':
      case 'PER_METRE':
      case 'METER':
      case 'METRE':
        return 'PER_LINEAR_METER';
      case 'PER_HOUR':
      case 'HOUR':
      case 'HOURLY':
        return 'PER_HOUR';
      case 'PER_VOLUME':
      case 'VOLUME':
      case 'PER_M3':
      case 'PER_CUBIC_METER':
      case 'CUBIC_METER':
        return 'PER_VOLUME';
      default:
        return 'UNKNOWN';
    }
  }

  unwrapCollection<T>(response: CollectionResponse<T> | null | undefined): T[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }

  getMaterialPrice(material: MaterialOption | null | undefined): number {
    const rawPrice = material?.price ?? material?.unit_price ?? material?.unitPrice;
    const parsed = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
