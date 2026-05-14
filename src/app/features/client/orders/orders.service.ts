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

export type OrderStatus =
  | 'BUDGETED'
  | 'PENDING_PAYMENT'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ClientOrder = {
  id: string;
  status: OrderStatus | string;
  payment_condition?: string | null;
  estimated_price?: number | string | null;
  advance_amount?: number | string | null;
  budget_expires_at?: string | null;
  created_at?: string | null;
  service_type?: {
    name?: string | null;
  } | null;
  serviceType?: {
    name?: string | null;
  } | null;
  material?: {
    name?: string | null;
  } | null;
  [key: string]: unknown;
};

export type OrderFile = {
  id?: string;
  file_url?: string | null;
  fileUrl?: string | null;
  file_type?: string | null;
  fileType?: string | null;
  uploaded_at?: string | null;
  uploadedAt?: string | null;
  [key: string]: unknown;
};

export type OrderPayment = {
  id?: string;
  amount?: number | string | null;
  payment_type?: string | null;
  paymentType?: string | null;
  status?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
};

export type ClientOrderDetail = ClientOrder & {
  notes?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  files?: OrderFile[] | null;
  payments?: OrderPayment[] | null;
};

type CollectionResponse<T> = T[] | { data?: T[] | null; total?: number } | { data?: T | null };
type ResourceResponse<T> = T | { data?: T | null };

export type CreateOrderPayload = {
  service_type_id: string;
  material_id: string;
  quantity?: number;
  area?: number;
  volume?: number;
  notes?: string;
};

export type FileUploadResponse = {
  data: {
    id: string;
    order_id: string;
    file_url: string;
    file_type: string;
    uploaded_at: string;
  };
};

export type ConfirmOrderResponse = {
  data: {
    id: string;
    status: string;
    updated_at: string;
  };
};

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

  getMyOrders(): Observable<CollectionResponse<ClientOrder>> {
    return this.http.get<CollectionResponse<ClientOrder>>('/api/orders/my');
  }

  getOrderById(orderId: string): Observable<ResourceResponse<ClientOrderDetail>> {
    return this.http.get<ResourceResponse<ClientOrderDetail>>(`/api/orders/${orderId}`);
  }

  createOrder(payload: CreateOrderPayload): Observable<ResourceResponse<ClientOrderDetail>> {
    return this.http.post<ResourceResponse<ClientOrderDetail>>('/api/orders', payload);
  }

  uploadOrderFile(orderId: string, file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileUploadResponse>(`/api/orders/${orderId}/files`, formData);
  }

  confirmOrder(orderId: string): Observable<ConfirmOrderResponse> {
    return this.http.post<ConfirmOrderResponse>(`/api/orders/${orderId}/confirm`, {});
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

  unwrapResource<T>(response: ResourceResponse<T> | null | undefined): T | null {
    if (!response) {
      return null;
    }

    if (typeof response === 'object' && response !== null && 'data' in response) {
      return response.data ?? null;
    }

    return response as T;
  }

  getMaterialPrice(material: MaterialOption | null | undefined): number {
    const rawPrice = material?.price ?? material?.unit_price ?? material?.unitPrice;
    const parsed = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  getOrderEstimatedPrice(order: ClientOrder | null | undefined): number {
    const rawPrice = order?.estimated_price;
    const parsed = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  getPaymentAmount(payment: OrderPayment | null | undefined): number {
    const rawAmount = payment?.amount;
    const parsed = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  getOrderFiles(order: ClientOrderDetail | null | undefined): OrderFile[] {
    return Array.isArray(order?.files) ? order.files : [];
  }

  getOrderPayments(order: ClientOrderDetail | null | undefined): OrderPayment[] {
    return Array.isArray(order?.payments) ? order.payments : [];
  }

  getFileUrl(file: OrderFile | null | undefined): string {
    const url = file?.file_url ?? file?.fileUrl;
    return typeof url === 'string' ? url : '';
  }

  getFileType(file: OrderFile | null | undefined): string {
    const type = file?.file_type ?? file?.fileType;
    return typeof type === 'string' ? type : 'Archivo';
  }
}
