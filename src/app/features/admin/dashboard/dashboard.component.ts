import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AdminStatsService,
  SalesStats,
  OrdersByStatus,
  ServiceStatsItem,
  SalesTrendItem,
} from './admin-stats.service';

// ── Local chart types ─────────────────────────────────────────────────────────

type PeriodKey = 'today' | 'week' | 'month';

interface ChartPoint {
  cx: number;
  cy: number;
  dateLabel: string;
  totalFormatted: string;
}

interface ChartYLine {
  lineX1: number; lineY: number; lineX2: number;
  labelX: number; labelY: number;
  label: string;
  isBaseline: boolean;
}

interface ChartXLabel {
  x: number;
  y: number;
  label: string;
}

// ── SVG chart constants ───────────────────────────────────────────────────────

const C_W   = 560;   // viewBox width
const C_H   = 180;   // viewBox height
const C_PL  = 58;    // padding left  (Y-axis labels)
const C_PR  = 12;    // padding right
const C_PT  = 14;    // padding top
const C_PB  = 36;    // padding bottom (X-axis labels)
const C_IW  = C_W - C_PL - C_PR;   // inner width  = 490
const C_IH  = C_H - C_PT - C_PB;   // inner height = 130
const C_BLY = C_PT + C_IH;          // baseline Y   = 144
const C_XLY = C_BLY + 20;           // X labels Y   = 164

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <div class="min-h-screen font-sans" style="background: #f4f5f6;">

      <!-- ── Navbar ─────────────────────────────────────────────────────────── -->
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
            <a routerLink="/admin/orders" class="px-4 py-2 rounded-lg text-sm font-medium" style="color: #3a8f8b;">Pedidos</a>
            <a routerLink="/admin/services" class="px-4 py-2 rounded-lg text-sm font-medium" style="color: #3a8f8b;">Servicios</a>
            <a routerLink="/admin/materials" class="px-4 py-2 rounded-lg text-sm font-medium" style="color: #3a8f8b;">Materiales</a>
            <button (click)="logout()"
              class="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style="background: #3a8f8b;"
              onmouseover="this.style.background='#2e7874'" onmouseout="this.style.background='#3a8f8b'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <!-- ── Contenido ──────────────────────────────────────────────────────── -->
      <main class="max-w-7xl mx-auto px-6 py-10">

        <!-- Encabezado -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold" style="color: #1f2937;">Panel de Administración</h1>
          <p class="text-sm mt-1" style="color: #6b7280;">Indicadores del negocio en tiempo real.</p>
        </div>

        <!-- ── KPI CARDS ──────────────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          <!-- KPI 1: Ventas totales -->
          <div class="rounded-xl p-5" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: #f0fafa; color: #3a8f8b; border: 1px solid #b2dedd;">Aprobados</span>
            </div>
            <div *ngIf="loadingStats" class="animate-pulse">
              <div class="h-7 w-32 rounded-lg mb-2" style="background: #f0f0f0;"></div>
              <div class="h-4 w-20 rounded" style="background: #f0f0f0;"></div>
            </div>
            <ng-container *ngIf="!loadingStats">
              <p class="text-2xl font-black" style="color: #1f2937;">{{ sales.total | currency:'PEN':'symbol':'1.2-2' }}</p>
              <p class="text-xs mt-1" style="color: #6b7280;">
                {{ sales.ordersCount }} pedido{{ sales.ordersCount !== 1 ? 's' : '' }} con pago aprobado
              </p>
            </ng-container>
            <p class="text-xs font-semibold mt-3" style="color: #9ca3af;">VENTAS TOTALES</p>
          </div>

          <!-- KPI 2: Pedidos activos -->
          <div class="rounded-xl p-5" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #eff6ff; border: 1px solid #bfdbfe;">
                <svg class="w-5 h-5" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: #eff6ff; color: #3b82f6; border: 1px solid #bfdbfe;">En proceso</span>
            </div>
            <div *ngIf="loadingStats" class="animate-pulse">
              <div class="h-7 w-16 rounded-lg mb-2" style="background: #f0f0f0;"></div>
              <div class="h-4 w-28 rounded" style="background: #f0f0f0;"></div>
            </div>
            <ng-container *ngIf="!loadingStats">
              <p class="text-2xl font-black" style="color: #1f2937;">{{ ordersInProgress }}</p>
              <p class="text-xs mt-1" style="color: #6b7280;">pedido{{ ordersInProgress !== 1 ? 's' : '' }} en producción ahora</p>
            </ng-container>
            <p class="text-xs font-semibold mt-3" style="color: #9ca3af;">PEDIDOS ACTIVOS</p>
          </div>

          <!-- KPI 3: Listos para recoger -->
          <div class="rounded-xl p-5" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
                <svg class="w-5 h-5" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
              </div>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: #f0fdf4; color: #059669; border: 1px solid #bbf7d0;">Listo</span>
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
        <!-- ── fin KPI CARDS ─────────────────────────────────────────────────── -->

        <!-- Error banner de KPIs -->
        <div *ngIf="statsError" class="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
             style="background: #fff0f0; border: 1px solid #f5c6c6; color: #c0392b;">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          No se pudieron cargar las estadísticas. Verifica que el backend esté en línea.
          <button (click)="loadStats()" class="ml-auto text-xs font-semibold underline" style="color: #c0392b;">Reintentar</button>
        </div>

        <!-- ── GRÁFICO DE VENTAS POR PERÍODO ──────────────────────────────────── -->
        <div class="mb-8">
          <section class="rounded-xl overflow-hidden"
                   style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">

            <!-- Cabecera + selector de período -->
            <div class="px-6 py-4 flex flex-wrap items-center justify-between gap-3" style="border-bottom: 1px solid #f0f0f0;">
              <div>
                <h2 class="font-bold text-sm" style="color: #1f2937;">Ventas por período</h2>
                <p class="text-xs mt-0.5" style="color: #6b7280;">Evolución diaria de ingresos aprobados</p>
              </div>

              <!-- Pill selector -->
              <div class="flex p-1 rounded-xl gap-0.5" style="background: #f3f4f6;">
                <button *ngFor="let p of periods"
                        (click)="selectPeriod(p.key)"
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        [style.background]="selectedPeriod === p.key ? 'white' : 'transparent'"
                        [style.color]="selectedPeriod === p.key ? '#3a8f8b' : '#9ca3af'"
                        [style.box-shadow]="selectedPeriod === p.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
                  {{ p.label }}
                </button>
              </div>
            </div>

            <!-- Cuerpo del gráfico -->
            <div class="px-6 py-6">

              <!-- Skeleton loading -->
              <div *ngIf="loadingChart" class="animate-pulse">
                <div class="rounded-xl w-full" style="background: #f3f4f6; height: 180px;"></div>
                <div class="flex justify-between mt-3">
                  <div class="h-3 w-12 rounded" style="background: #f0f0f0;"></div>
                  <div class="h-3 w-12 rounded" style="background: #f0f0f0;"></div>
                  <div class="h-3 w-12 rounded" style="background: #f0f0f0;"></div>
                </div>
              </div>

              <!-- Error del gráfico -->
              <div *ngIf="!loadingChart && chartError"
                   class="flex flex-col items-center justify-center py-10 gap-3">
                <svg class="w-8 h-8" fill="none" stroke="#f5c6c6" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p class="text-sm" style="color: #9ca3af;">No se pudo cargar el gráfico</p>
                <button (click)="loadSalesTrend()"
                        class="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style="color: #3a8f8b; border: 1px solid #b2dedd; background: #f0fafa;">
                  Reintentar
                </button>
              </div>

              <!-- Estado vacío -->
              <div *ngIf="!loadingChart && !chartError && chartPoints.length === 0"
                   class="flex flex-col items-center justify-center py-10 gap-2">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                     style="background: #f9fafb; border: 1px solid #f0f0f0;">
                  <svg class="w-6 h-6" fill="none" stroke="#d1d5db" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <p class="text-sm font-medium" style="color: #6b7280;">Sin ventas en este período</p>
                <p class="text-xs" style="color: #9ca3af;">Los datos aparecerán cuando haya pagos aprobados</p>
              </div>

              <!-- ── SVG Line chart ────────────────────────────────────────────── -->
              <ng-container *ngIf="!loadingChart && !chartError && chartPoints.length > 0">
                <svg [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH"
                     class="w-full"
                     style="overflow: visible; display: block;">
                  <defs>
                    <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#3a8f8b" stop-opacity="0.18"/>
                      <stop offset="100%" stop-color="#3a8f8b" stop-opacity="0.01"/>
                    </linearGradient>
                  </defs>

                  <!-- Y grid lines + labels -->
                  <g *ngFor="let gl of chartYLines">
                    <line [attr.x1]="gl.lineX1" [attr.y1]="gl.lineY"
                          [attr.x2]="gl.lineX2" [attr.y2]="gl.lineY"
                          [attr.stroke]="gl.isBaseline ? '#e5e7eb' : '#f3f4f6'"
                          [attr.stroke-width]="gl.isBaseline ? 1 : 1"
                          stroke-dasharray="none"/>
                    <text [attr.x]="gl.labelX" [attr.y]="gl.labelY"
                          text-anchor="end"
                          style="font-size: 10px; fill: #9ca3af; font-family: sans-serif;">
                      {{ gl.label }}
                    </text>
                  </g>

                  <!-- Area fill -->
                  <path [attr.d]="chartAreaPath" fill="url(#salesAreaGrad)"/>

                  <!-- Line -->
                  <path [attr.d]="chartLinePath"
                        fill="none" stroke="#3a8f8b" stroke-width="2"
                        stroke-linejoin="round" stroke-linecap="round"/>

                  <!-- Data point dots -->
                  <g *ngFor="let pt of chartPoints">
                    <circle [attr.cx]="pt.cx" [attr.cy]="pt.cy" r="3.5"
                            fill="white" stroke="#3a8f8b" stroke-width="2">
                      <title>{{ pt.dateLabel }}: {{ pt.totalFormatted }}</title>
                    </circle>
                  </g>

                  <!-- X axis date labels -->
                  <text *ngFor="let xl of chartXLabels"
                        [attr.x]="xl.x" [attr.y]="xl.y"
                        text-anchor="middle"
                        style="font-size: 10px; fill: #9ca3af; font-family: sans-serif;">
                    {{ xl.label }}
                  </text>

                </svg>

                <!-- Resumen del período -->
                <div class="flex items-center justify-between mt-4 pt-4"
                     style="border-top: 1px solid #f3f4f6;">
                  <p class="text-xs" style="color: #9ca3af;">
                    {{ periodSummaryLabel }}
                  </p>
                  <p class="text-sm font-bold" style="color: #3a8f8b;">
                    Total: {{ chartPeriodTotal | currency:'PEN':'symbol':'1.2-2' }}
                  </p>
                </div>
              </ng-container>
              <!-- ── fin SVG chart ─────────────────────────────────────────────── -->

            </div>
          </section>
        </div>
        <!-- ── fin GRÁFICO DE VENTAS ─────────────────────────────────────────── -->

        <!-- ── GRÁFICO DE SERVICIOS MÁS FRECUENTES ────────────────────────────── -->
        <div class="mb-8">
          <section class="rounded-xl overflow-hidden"
                   style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">

            <div class="px-6 py-4 flex items-center justify-between" style="border-bottom: 1px solid #f0f0f0;">
              <div>
                <h2 class="font-bold text-sm" style="color: #1f2937;">Servicios más solicitados</h2>
                <p class="text-xs mt-0.5" style="color: #6b7280;">Ranking por número de pedidos registrados</p>
              </div>
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                   style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-4 h-4" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>

            <div class="px-6 py-6">

              <!-- Skeleton -->
              <div *ngIf="loadingStats" class="space-y-5 animate-pulse">
                <div *ngFor="let _ of [1,2,3,4]">
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="h-3.5 rounded w-28" style="background: #f0f0f0;"></div>
                    <div class="h-3.5 rounded w-8" style="background: #f0f0f0;"></div>
                  </div>
                  <div class="h-3 rounded-full w-full" style="background: #f0f0f0;"></div>
                </div>
              </div>

              <!-- Vacío -->
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
                  <div class="flex items-center justify-between gap-4 mb-1.5">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            [style.background]="i === 0 ? '#f0fafa' : '#f9fafb'"
                            [style.color]="i === 0 ? '#3a8f8b' : '#9ca3af'"
                            [style.border]="i === 0 ? '1px solid #b2dedd' : '1px solid #f0f0f0'">
                        {{ i + 1 }}
                      </span>
                      <span class="text-sm font-medium truncate" style="color: #374151;">
                        {{ getServiceLabel(item) }}
                      </span>
                    </div>
                    <span class="shrink-0 text-sm font-bold" style="color: #1f2937;">
                      {{ +item.count }} pedido{{ +item.count !== 1 ? 's' : '' }}
                    </span>
                  </div>
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
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <a routerLink="/admin/orders"
             class="flex items-center gap-4 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 style="background: #f0fafa; border: 1px solid #b2dedd;">
              <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Pedidos</h2>
              <p class="text-xs mt-0.5" style="color: #6b7280;">Filtrar por estado y fecha</p>
            </div>
            <svg class="w-4 h-4 ml-auto shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>

           <a routerLink="/admin/services"
             class="flex items-center gap-4 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style="background: #f0fafa; border: 1px solid #b2dedd;">
              <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Servicios</h2>
              <p class="text-xs mt-0.5" style="color: #6b7280;">Activar, editar y configurar servicios</p>
            </div>
            <svg class="w-4 h-4 ml-auto shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>

          <a routerLink="/admin/materials"
             class="flex items-center gap-4 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 style="background: #f0fafa; border: 1px solid #b2dedd;">
              <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Materiales</h2>
              <p class="text-xs mt-0.5" style="color: #6b7280;">Precios, disponibilidad y catálogo</p>
            </div>
            <svg class="w-4 h-4 ml-auto shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </main>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private router       = inject(Router);
  private statsService = inject(AdminStatsService);

  // ── KPI state ─────────────────────────────────────────────────────────────
  loadingStats = false;
  statsError   = false;
  sales: SalesStats            = { total: 0, ordersCount: 0 };
  private ordersByStatus: OrdersByStatus = new Map();
  topServices: ServiceStatsItem[]        = [];

  get ordersInProgress(): number { return this.ordersByStatus.get('IN_PROGRESS') ?? 0; }
  get ordersReady():      number { return this.ordersByStatus.get('READY')       ?? 0; }

  // ── Chart state ───────────────────────────────────────────────────────────
  readonly periods: Array<{ key: PeriodKey; label: string }> = [
    { key: 'today', label: 'Hoy'          },
    { key: 'week',  label: 'Esta semana'  },
    { key: 'month', label: 'Este mes'     },
  ];

  selectedPeriod: PeriodKey = 'week';
  loadingChart  = false;
  chartError    = false;

  // SVG viewBox dimensions (exposed to template)
  readonly chartW = C_W;
  readonly chartH = C_H;

  // Computed SVG data (set by computeChart)
  chartLinePath    = '';
  chartAreaPath    = '';
  chartPoints:   ChartPoint[]  = [];
  chartYLines:   ChartYLine[]  = [];
  chartXLabels:  ChartXLabel[] = [];
  chartPeriodTotal = 0;
  periodSummaryLabel = '';

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats();
    this.loadSalesTrend();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadStats(): void {
    this.loadingStats = true;
    this.statsError   = false;

    forkJoin({
      sales:    this.statsService.getSales(),
      byStatus: this.statsService.getOrdersByStatus(),
      services: this.statsService.getTopServices(),
    }).subscribe({
      next: ({ sales, byStatus, services }) => {
        this.sales          = sales;
        this.ordersByStatus = byStatus;
        this.topServices    = services;
        this.loadingStats   = false;
      },
      error: () => {
        this.loadingStats = false;
        this.statsError   = true;
      },
    });
  }

  selectPeriod(period: PeriodKey): void {
    this.selectedPeriod = period;
    this.loadSalesTrend();
  }

  loadSalesTrend(): void {
    this.loadingChart = true;
    this.chartError   = false;

    const { from, to } = this.getPeriodDates(this.selectedPeriod);
    this.statsService.getSalesTrend(from, to).subscribe({
      next: (trend) => {
        this.computeChart(trend);
        this.loadingChart = false;
      },
      error: () => {
        this.loadingChart = false;
        this.chartError   = true;
      },
    });
  }

  // ── Chart computation ─────────────────────────────────────────────────────

  private computeChart(items: SalesTrendItem[]): void {
    if (!items.length) {
      this.chartPoints     = [];
      this.chartLinePath   = '';
      this.chartAreaPath   = '';
      this.chartYLines     = [];
      this.chartXLabels    = [];
      this.chartPeriodTotal = 0;
      this.periodSummaryLabel = this.buildSummaryLabel();
      return;
    }

    const maxRaw  = Math.max(...items.map(i => Number(i.total ?? 0)));
    const niceMax = this.niceMax(maxRaw);

    // ── Points ──
    this.chartPoints = items.map((item, idx) => {
      const cx = C_PL + (items.length === 1 ? C_IW / 2 : (idx / (items.length - 1)) * C_IW);
      const cy = C_PT + C_IH - (Number(item.total ?? 0) / niceMax) * C_IH;
      return {
        cx,
        cy,
        dateLabel:      this.formatDate(item.date),
        totalFormatted: `S/ ${Number(item.total ?? 0).toFixed(2)}`,
      };
    });

    // ── Line & area paths ──
    const lineSegs = this.chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
    this.chartLinePath = lineSegs;

    const first = this.chartPoints[0];
    const last  = this.chartPoints[this.chartPoints.length - 1];
    this.chartAreaPath = `${lineSegs} L${last.cx.toFixed(1)},${C_BLY} L${first.cx.toFixed(1)},${C_BLY} Z`;

    // ── Y grid lines (4 levels: 0, 33%, 66%, 100%) ──
    const fractions = [0, 1/3, 2/3, 1];
    this.chartYLines = fractions.map(f => {
      const val = niceMax * f;
      const ly  = C_PT + C_IH - f * C_IH;
      return {
        lineX1: C_PL, lineY: ly, lineX2: C_PL + C_IW,
        labelX: C_PL - 6, labelY: ly + 4,
        label: this.formatCurrency(val),
        isBaseline: f === 0,
      };
    });

    // ── X axis labels (max 7, evenly spaced) ──
    const step = items.length <= 7 ? 1 : Math.ceil(items.length / 6);
    this.chartXLabels = items
      .map((item, idx) => {
        const x = C_PL + (items.length === 1 ? C_IW / 2 : (idx / (items.length - 1)) * C_IW);
        return { x, y: C_XLY, label: this.formatDate(item.date), idx };
      })
      .filter(xl => xl.idx % step === 0 || xl.idx === items.length - 1);

    // ── Period summary ──
    this.chartPeriodTotal   = items.reduce((sum, i) => sum + Number(i.total ?? 0), 0);
    this.periodSummaryLabel = this.buildSummaryLabel();
  }

  // ── Pure helpers ──────────────────────────────────────────────────────────

  private getPeriodDates(period: PeriodKey): { from: string; to: string } {
    const now = new Date();
    const fmt = (d: Date) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    };
    const today = fmt(now);

    if (period === 'today') {
      return { from: today, to: today };
    }
    const past = new Date(now);
    past.setDate(now.getDate() - (period === 'week' ? 6 : 29));
    return { from: fmt(past), to: today };
  }

  private niceMax(value: number): number {
    if (value <= 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / magnitude) * magnitude;
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00'); // noon avoids UTC offset issues
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()}/${months[d.getMonth()]}`;
  }

  private formatCurrency(value: number): string {
    if (value === 0) return 'S/ 0';
    if (value >= 1000) return `S/ ${(value / 1000).toFixed(1)}k`;
    return `S/ ${Math.round(value)}`;
  }

  private buildSummaryLabel(): string {
    const labels: Record<PeriodKey, string> = {
      today: 'Hoy',
      week:  'Últimos 7 días',
      month: 'Últimos 30 días',
    };
    return labels[this.selectedPeriod];
  }

  // ── Services bar chart helpers ─────────────────────────────────────────────
  getServiceLabel(item: ServiceStatsItem): string {
    return item.service_name ?? item.serviceName ?? item.name ?? 'Sin nombre';
  }

  getBarWidthPct(count: number | string): number {
    if (!this.topServices.length) return 0;
    const max = Math.max(...this.topServices.map(s => Number(s.count ?? 0)));
    return max > 0 ? Math.round((Number(count ?? 0) / max) * 100) : 0;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  logout(): void {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
