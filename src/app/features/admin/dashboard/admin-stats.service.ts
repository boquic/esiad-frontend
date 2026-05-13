import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

// ── Response shapes (flexible to handle nested data wrapper) ──────────────────

export type SalesStatsRaw = {
  data?: {
    total?: number | string | null;
    period?: string | null;
    count?: number | null;
  } | null;
  total?: number | string | null;
  count?: number | null;
};

export type OrdersByStatusItem = {
  status: string;
  count: number | string;
};

export type OrdersByStatusRaw = {
  data?: OrdersByStatusItem[] | null;
} | OrdersByStatusItem[];

export type ServiceStatsItem = {
  service_name?: string | null;
  serviceName?: string | null;
  name?: string | null;
  count: number | string;
};

export type ServiceStatsRaw = {
  data?: ServiceStatsItem[] | null;
} | ServiceStatsItem[];

// ── Normalized output types ───────────────────────────────────────────────────

export type SalesStats = {
  total: number;       // Sum of approved payments (PEN)
  ordersCount: number; // Number of orders that generated those sales
};

export type OrdersByStatus = Map<string, number>;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);
  private base = '/api/admin/stats';

  /**
   * GET /api/admin/stats/sales
   * Returns total approved sales amount and related order count.
   */
  getSales(): Observable<SalesStats> {
    return this.http.get<SalesStatsRaw>(`${this.base}/sales`).pipe(
      map((res) => {
        const payload = res?.data ?? res;
        const raw = payload as { total?: number | string | null; count?: number | null };
        return {
          total: Number(raw?.total ?? 0),
          ordersCount: Number(raw?.count ?? 0),
        };
      }),
      catchError(() => of({ total: 0, ordersCount: 0 })),
    );
  }

  /**
   * GET /api/admin/stats/orders-by-status
   * Returns a list of { status, count } items.
   */
  getOrdersByStatus(): Observable<OrdersByStatus> {
    return this.http.get<OrdersByStatusRaw>(`${this.base}/orders-by-status`).pipe(
      map((res) => {
        const items: OrdersByStatusItem[] = Array.isArray(res)
          ? res
          : Array.isArray((res as { data?: OrdersByStatusItem[] | null })?.data)
            ? ((res as { data: OrdersByStatusItem[] }).data)
            : [];

        const map_ = new Map<string, number>();
        for (const item of items) {
          map_.set(String(item.status).toUpperCase(), Number(item.count ?? 0));
        }
        return map_;
      }),
      catchError(() => of(new Map<string, number>())),
    );
  }

  /**
   * GET /api/admin/stats/services
   * Returns ranking of most-requested services sorted by count descending.
   */
  getTopServices(): Observable<ServiceStatsItem[]> {
    return this.http.get<ServiceStatsRaw>(`${this.base}/services`).pipe(
      map((res) => {
        const items: ServiceStatsItem[] = Array.isArray(res)
          ? res
          : Array.isArray((res as { data?: ServiceStatsItem[] | null })?.data)
            ? ((res as { data: ServiceStatsItem[] }).data)
            : [];

        return items
          .map((item) => ({ ...item, count: Number(item.count ?? 0) }))
          .sort((a, b) => Number(b.count) - Number(a.count))
          .slice(0, 6);
      }),
      catchError(() => of([])),
    );
  }
}
