import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

// ── Response shapes ───────────────────────────────────────────────────────────

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

export type SalesTrendItem = {
  date: string;              // "YYYY-MM-DD"
  total: number | string;   // sum of approved payments for this day
  count?: number | string | null;
};

export type SalesTrendRaw = {
  data?: SalesTrendItem[] | SalesTrendItem | null;
  total?: number | string | null;
} | SalesTrendItem[];

// ── Normalized output types ───────────────────────────────────────────────────

export type SalesStats = {
  total: number;
  ordersCount: number;
};

export type OrdersByStatus = Map<string, number>;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);
  private base = '/api/admin/stats';

  /**
   * GET /api/admin/stats/sales
   * Returns total approved sales amount and related order count (no date filter).
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
   * GET /api/admin/stats/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day
   * Returns time-series daily data for the sales line chart.
   * Falls back gracefully if the backend returns a single aggregate or an error.
   */
  getSalesTrend(from: string, to: string): Observable<SalesTrendItem[]> {
    return this.http
      .get<SalesTrendRaw>(`${this.base}/sales`, {
        params: { from, to, groupBy: 'day' },
      })
      .pipe(
        map((res) => {
          // Array directly at root
          if (Array.isArray(res)) {
            return this.normalizeTrendItems(res);
          }
          const data = (res as { data?: unknown }).data;
          // Array wrapped in { data: [...] }
          if (Array.isArray(data)) {
            return this.normalizeTrendItems(data as SalesTrendItem[]);
          }
          // Single aggregate wrapped in { data: { total, count } } → single point
          if (data && typeof data === 'object') {
            const raw = data as { total?: number | string | null };
            return [{ date: to, total: Number(raw.total ?? 0) }];
          }
          // Top-level single aggregate (no data wrapper)
          const topRaw = res as { total?: number | string | null };
          if (topRaw.total !== undefined) {
            return [{ date: to, total: Number(topRaw.total ?? 0) }];
          }
          return [];
        }),
        catchError(() => of([])),
      );
  }

  /**
   * GET /api/admin/stats/orders-by-status
   * Returns a Map of status → count.
   */
  getOrdersByStatus(): Observable<OrdersByStatus> {
    return this.http.get<OrdersByStatusRaw>(`${this.base}/orders-by-status`).pipe(
      map((res) => {
        const items: OrdersByStatusItem[] = Array.isArray(res)
          ? res
          : Array.isArray((res as { data?: OrdersByStatusItem[] | null })?.data)
            ? (res as { data: OrdersByStatusItem[] }).data
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
            ? (res as { data: ServiceStatsItem[] }).data
            : [];

        return items
          .map((item) => ({ ...item, count: Number(item.count ?? 0) }))
          .sort((a, b) => Number(b.count) - Number(a.count))
          .slice(0, 6);
      }),
      catchError(() => of([])),
    );
  }

  /**
   * GET /api/admin/stats/clients
   * Returns top clients
   */
  getClientsStats(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/clients`).pipe(
      map(res => Array.isArray(res) ? res : (res?.data || [])),
      catchError(() => of([]))
    );
  }

  /**
   * GET /api/admin/stats/operators
   * Returns operator performance stats
   */
  getOperatorsStats(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/operators`).pipe(
      map(res => Array.isArray(res) ? res : (res?.data || [])),
      catchError(() => of([]))
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private normalizeTrendItems(items: SalesTrendItem[]): SalesTrendItem[] {
    return items.map((item) => ({ ...item, total: Number(item.total ?? 0) }));
  }
}
