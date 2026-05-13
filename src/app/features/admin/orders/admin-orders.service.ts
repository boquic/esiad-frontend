import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

// ── Raw shapes (flexible for different backend conventions) ───────────────────

export type AdminOrderRaw = {
  id: string;
  status: string;
  estimated_price?: number | string | null;
  estimatedPrice?: number | string | null;
  payment_condition?: string | null;
  paymentCondition?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  notes?: string | null;
  // Relations
  client?: {
    first_name?: string | null;
    firstName?: string | null;
    last_name?: string | null;
    lastName?: string | null;
    dni?: string | null;
    phone?: string | null;
  } | null;
  service_type?: { name?: string | null } | null;
  serviceType?:  { name?: string | null } | null;
  material?: { name?: string | null } | null;
  operator?: {
    user?: {
      first_name?: string | null;
      firstName?: string | null;
      last_name?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
};

export type AdminOrdersResponse =
  | { data?: AdminOrderRaw[] | null; total?: number | null }
  | AdminOrderRaw[];

// ── Normalized flat type used by the component ────────────────────────────────

export type AdminOrder = {
  id: string;
  shortId: string;          // first 8 chars of UUID
  status: string;
  estimatedPrice: number;
  paymentCondition: string;
  createdAt: string;        // ISO string
  notes: string | null;
  clientName: string;
  clientDni: string;
  serviceName: string;
  materialName: string;
  operatorName: string | null;
};

export type AdminOrderFilters = {
  status: string;   // '' = all
  from:   string;   // 'YYYY-MM-DD' or ''
  to:     string;   // 'YYYY-MM-DD' or ''
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private http = inject(HttpClient);
  private base = '/api/admin/orders';

  /**
   * GET /api/admin/orders?status=...&from=...&to=...
   * Returns paginated (or full) list of orders for the admin table.
   */
  getOrders(filters: AdminOrderFilters): Observable<AdminOrder[]> {
    const params: Record<string, string> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.from)   params['from']   = filters.from;
    if (filters.to)     params['to']     = filters.to;

    return this.http
      .get<AdminOrdersResponse>(this.base, { params })
      .pipe(
        map((res) => {
          const items: AdminOrderRaw[] = Array.isArray(res)
            ? res
            : Array.isArray((res as { data?: AdminOrderRaw[] | null }).data)
              ? (res as { data: AdminOrderRaw[] }).data
              : [];

          return items.map((raw) => this.normalize(raw));
        }),
        catchError(() => of([])),
      );
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private normalize(raw: AdminOrderRaw): AdminOrder {
    const client = raw.client;
    const clientFirstName =
      client?.first_name ?? client?.firstName ?? '';
    const clientLastName  =
      client?.last_name  ?? client?.lastName  ?? '';
    const clientName =
      `${clientFirstName} ${clientLastName}`.trim() || 'Cliente desconocido';

    const svcName =
      raw.service_type?.name ?? raw.serviceType?.name ?? '—';
    const matName = raw.material?.name ?? '—';

    const opUser = raw.operator?.user;
    const operatorName = opUser
      ? `${opUser.first_name ?? opUser.firstName ?? ''} ${opUser.last_name ?? opUser.lastName ?? ''}`.trim() || null
      : null;

    return {
      id:               raw.id,
      shortId:          raw.id.length > 8 ? raw.id.slice(0, 8) : raw.id,
      status:           String(raw.status ?? '').toUpperCase(),
      estimatedPrice:   Number(raw.estimated_price ?? raw.estimatedPrice ?? 0),
      paymentCondition: String(raw.payment_condition ?? raw.paymentCondition ?? ''),
      createdAt:        String(raw.created_at ?? raw.createdAt ?? ''),
      notes:            raw.notes ?? null,
      clientName,
      clientDni:        client?.dni ?? '—',
      serviceName:      svcName,
      materialName:     matName,
      operatorName:     operatorName || null,
    };
  }
}
