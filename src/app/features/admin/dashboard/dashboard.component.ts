import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminStatsService, SalesStats, OrdersByStatus, ServiceStatsItem } from './admin-stats.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="min-h-screen font-sans" style="background: #f4f5f6;">

      <!-- Navbar -->
      <nav style="background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg width="28" height="32" viewBox="0 0 72 80" fill="none">
              <polygon points="4,76 26,4 36,4 18,76" fill="#3a8f8b"/>
              <polygon points="68,76 46,4 36,4 54,76" fill="#3a8f8b"/>
              <rect x="16" y="42" width="40" height="8" rx="1" fill="#3a8f8b"/>
            </svg>
            <div>
              <p class="font-bold text-sm tracking-widest uppercase" style="color: #2c2c2c; letter-spacing: 0.15em;">ESIAD ARQ</p>
              <p class="text-xs" style="color: #3a8f8b; letter-spacing: 0.08em;">Administración</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <a routerLink="/admin/services"
               class="px-4 py-2 rounded-lg text-sm font-medium"
               style="color: #3a8f8b;">
              Servicios
            </a>
            <a routerLink="/admin/materials"
               class="px-4 py-2 rounded-lg text-sm font-medium"
               style="color: #3a8f8b;">
              Materiales
            </a>
            <button (click)="logout()"
              class="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style="background: #3a8f8b;"
              onmouseover="this.style.background='#2e7874'" onmouseout="this.style.background='#3a8f8b'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <!-- Contenido -->
      <main class="max-w-7xl mx-auto px-6 py-10">

        <!-- Encabezado -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold" style="color: #1f2937;">Panel de Administración</h1>
          <p class="text-sm mt-1" style="color: #6b7280;">Indicadores del negocio en tiempo real.</p>
        </div>

        <!-- ── KPI CARDS ─────────────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          <!-- KPI 1: Ventas totales -->
          <div class="rounded-xl p-5" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: #f0fafa; color: #3a8f8b; border: 1px solid #b2dedd;">
                Aprobados
              </span>
            </div>
            <div *ngIf="loadingStats" class="animate-pulse">
              <div class="h-7 w-32 rounded-lg mb-2" style="background: #f0f0f0;"></div>
              <div class="h-4 w-20 rounded" style="background: #f0f0f0;"></div>
            </div>
            <ng-container *ngIf="!loadingStats">
              <p class="text-2xl font-black" style="color: #1f2937;">
                {{ sales.total | currency:'PEN':'symbol':'1.2-2' }}
              </p>
              <p class="text-xs mt-1" style="color: #6b7280;">
                {{ sales.ordersCount }} pedido{{ sales.ordersCount !== 1 ? 's' : '' }} con pago aprobado
              </p>
            </ng-container>
            <p class="text-xs font-semibold mt-3" style="color: #9ca3af;">VENTAS TOTALES</p>
          </div>

          <!-- KPI 2: Pedidos activos (IN_PROGRESS) -->
          <div class="rounded-xl p-5" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #eff6ff; border: 1px solid #bfdbfe;">
                <svg class="w-5 h-5" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe;">
                En proceso
              </span>
            </div>
            <div *ngIf="loadingStats" class="animate-pulse">
              <div class="h-7 w-16 rounded-lg mb-2" style="background: #f0f0f0;"></div>
              <div class="h-4 w-28 rounded" style="background: #f0f0f0;"></div>
            </div>
            <ng-container *ngIf="!loadingStats">
              <p class="text-2xl font-black" style="color: #1f2937;">{{ ordersInProgress }}</p>
              <p class="text-xs mt-1" style="color: #6b7280;">
                pedido{{ ordersInProgress !== 1 ? 's' : '' }} en producción ahora
              </p>
            </ng-container>
            <p class="text-xs font-semibold mt-3" style="color: #9ca3af;">PEDIDOS ACTIVOS</p>
          </div>

          <!-- KPI 3: Pedidos listos para recoger (READY) -->
          <div class="rounded-xl p-5" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
                <svg class="w-5 h-5" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: #f0fdf4; color: #059669; border: 1px solid #bbf7d0;">
                Listo
              </span>
            </div>
            <div *ngIf="loadingStats" class="animate-pulse">
              <div class="h-7 w-16 rounded-lg mb-2" style="background: #f0f0f0;"></div>
              <div class="h-4 w-28 rounded" style="background: #f0f0f0;"></div>
            </div>
            <ng-container *ngIf="!loadingStats">
              <p class="text-2xl font-black" style="color: #1f2937;">{{ ordersReady }}</p>
              <p class="text-xs mt-1" style="color: #6b7280;">
                pedido{{ ordersReady !== 1 ? 's' : '' }} esperando ser recogido{{ ordersReady !== 1 ? 's' : '' }}
              </p>
            </ng-container>
            <p class="text-xs font-semibold mt-3" style="color: #9ca3af;">LISTOS PARA RECOGER</p>
          </div>

        </div>
        <!-- ── fin KPI CARDS ──────────────────────────────────────────────────── -->

        <!-- Error de carga de stats -->
        <div *ngIf="statsError" class="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
             style="background: #fff0f0; border: 1px solid #f5c6c6; color: #c0392b;">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          No se pudieron cargar las estadísticas. Verifica que el backend esté en línea.
          <button (click)="loadStats()" class="ml-auto text-xs font-semibold underline" style="color: #c0392b;">
            Reintentar
          </button>
        </div>

        <!-- ── GRÁFICO DE SERVICIOS MÁS FRECUENTES ────────────────────────────── -->
        <div class="mb-8">
          <section class="rounded-xl overflow-hidden"
                   style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">

            <!-- Cabecera -->
            <div class="px-6 py-4 flex items-center justify-between" style="border-bottom: 1px solid #f0f0f0;">
              <div>
                <h2 class="font-bold text-sm" style="color: #1f2937;">Servicios más solicitados</h2>
                <p class="text-xs mt-0.5" style="color: #6b7280;">Ranking por número de pedidos registrados</p>
              </div>
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                   style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-4 h-4" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>

            <!-- Cuerpo -->
            <div class="px-6 py-6">

              <!-- Skeleton loading -->
              <div *ngIf="loadingStats" class="space-y-5 animate-pulse">
                <div *ngFor="let _ of [1,2,3,4]">
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="h-3.5 rounded w-28" style="background: #f0f0f0;"></div>
                    <div class="h-3.5 rounded w-8" style="background: #f0f0f0;"></div>
                  </div>
                  <div class="h-3 rounded-full w-full" style="background: #f0f0f0;"></div>
                </div>
              </div>

              <!-- Estado vacío -->
              <div *ngIf="!loadingStats && topServices.length === 0 && !statsError"
                   class="text-center py-10">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                     style="background: #f9fafb; border: 1px solid #f0f0f0;">
                  <svg class="w-6 h-6" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <p class="text-sm font-medium" style="color: #6b7280;">Sin datos de servicios aún</p>
                <p class="text-xs mt-1" style="color: #9ca3af;">Los datos aparecerán cuando haya pedidos registrados</p>
              </div>

              <!-- Barras horizontales -->
              <div *ngIf="!loadingStats && topServices.length > 0" class="space-y-4">
                <div *ngFor="let item of topServices; let i = index">

                  <!-- Fila: nombre + conteo -->
                  <div class="flex items-center justify-between gap-4 mb-1.5">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <!-- Posición ranking -->
                      <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            [style.background]="i === 0 ? '#f0fafa' : '#f9fafb'"
                            [style.color]="i === 0 ? '#3a8f8b' : '#9ca3af'"
                            [style.border]="i === 0 ? '1px solid #b2dedd' : '1px solid #f0f0f0'">
                        {{ i + 1 }}
                      </span>
                      <span class="text-sm font-medium truncate" style="color: #374151;">
                        {{ getServiceLabel(item) }}
                      </span>
                    </div>
                    <span class="flex-shrink-0 text-sm font-bold" style="color: #1f2937;">
                      {{ +item.count }} pedido{{ +item.count !== 1 ? 's' : '' }}
                    </span>
                  </div>

                  <!-- Barra -->
                  <div class="w-full rounded-full overflow-hidden" style="background: #f3f4f6; height: 10px;">
                    <div class="h-full rounded-full transition-all duration-700 ease-out"
                         [style.width]="getBarWidthPct(item.count) + '%'"
                         [style.background]="i === 0 ? '#3a8f8b' : i === 1 ? '#4da8a5' : i === 2 ? '#6dbdba' : '#a8d8d7'">
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>
        </div>
        <!-- ── fin GRÁFICO DE SERVICIOS ───────────────────────────────────────── -->

        <!-- Accesos rápidos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">

          <a routerLink="/admin/services"
             class="flex items-center gap-4 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background: #f0fafa; border: 1px solid #b2dedd;">
              <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Servicios</h2>
              <p class="text-xs mt-0.5" style="color: #6b7280;">Activar, editar y configurar servicios</p>
            </div>
            <svg class="w-4 h-4 ml-auto flex-shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>

          <a routerLink="/admin/materials"
             class="flex items-center gap-4 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background: #f0fafa; border: 1px solid #b2dedd;">
              <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Materiales</h2>
              <p class="text-xs mt-0.5" style="color: #6b7280;">Precios, disponibilidad y catálogo</p>
            </div>
            <svg class="w-4 h-4 ml-auto flex-shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </main>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private router = inject(Router);
  private statsService = inject(AdminStatsService);

  // ── State ──────────────────────────────────────────────────────────────────
  loadingStats = false;
  statsError = false;

  sales: SalesStats = { total: 0, ordersCount: 0 };
  private ordersByStatus: OrdersByStatus = new Map();
  topServices: ServiceStatsItem[] = [];

  get ordersInProgress(): number {
    return this.ordersByStatus.get('IN_PROGRESS') ?? 0;
  }

  get ordersReady(): number {
    return this.ordersByStatus.get('READY') ?? 0;
  }

  // ── Helpers para el gráfico ────────────────────────────────────────────────

  /** Devuelve el nombre del servicio manejando las diferentes claves que puede traer el backend */
  getServiceLabel(item: ServiceStatsItem): string {
    return item.service_name ?? item.serviceName ?? item.name ?? 'Sin nombre';
  }

  /** Ancho de la barra en % relativo al servicio con mayor conteo */
  getBarWidthPct(count: number | string): number {
    if (!this.topServices.length) return 0;
    const max = Math.max(...this.topServices.map(s => Number(s.count ?? 0)));
    return max > 0 ? Math.round((Number(count ?? 0) / max) * 100) : 0;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loadingStats = true;
    this.statsError = false;

    forkJoin({
      sales: this.statsService.getSales(),
      byStatus: this.statsService.getOrdersByStatus(),
      services: this.statsService.getTopServices(),
    }).subscribe({
      next: ({ sales, byStatus, services }) => {
        this.sales = sales;
        this.ordersByStatus = byStatus;
        this.topServices = services;
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
        this.statsError = true;
      },
    });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
