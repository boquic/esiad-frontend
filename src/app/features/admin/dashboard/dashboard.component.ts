import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AdminStatsService,
  SalesStats,
  OrdersByStatus,
  ServiceStatsItem,
  SalesTrendItem,
} from './admin-stats.service';
import { AdminOrdersService, AdminOrder } from '../orders/admin-orders.service';
import { AdminPaymentsService, AdminPayment } from '../payments/admin-payments.service';

// ── Chart helpers ─────────────────────────────────────────────────────────────

type PeriodKey = 'today' | 'week' | 'month';

interface ChartPoint  { cx: number; cy: number; dateLabel: string; totalFormatted: string; }
interface ChartYLine  { lineX1: number; lineY: number; lineX2: number; labelX: number; labelY: number; label: string; }
interface ChartXLabel { x: number; y: number; label: string; }

const C_W  = 480;
const C_H  = 180;
const C_PL = 52;
const C_PR = 10;
const C_PT = 12;
const C_PB = 32;
const C_IW = C_W - C_PL - C_PR;
const C_IH = C_H - C_PT - C_PB;
const C_BLY = C_PT + C_IH;
const C_XLY = C_BLY + 20;

// ── Service colors (deterministic) ────────────────────────────────────────────
const SVC_COLORS = ['#2e7874','#3a8f8b','#6bb0ad','#a8c0be','#4a7a77','#5d8f89'];
function svcColor(name: string): string {
  const h = (name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return SVC_COLORS[h % SVC_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private cd            = inject(ChangeDetectorRef);
  private statsService  = inject(AdminStatsService);
  private ordersService = inject(AdminOrdersService);
  private paymentsService = inject(AdminPaymentsService);

  // ── Today label ──────────────────────────────────────────────────────────
  get todayLabel(): string {
    const now  = new Date();
    const day  = now.toLocaleDateString('es-PE', { weekday: 'long' });
    const date = now.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    return day.charAt(0).toUpperCase() + day.slice(1) + ', ' + date;
  }

  // ── KPI state ────────────────────────────────────────────────────────────
  loadingStats = true;
  statsError   = false;
  sales: SalesStats = { total: 0, ordersCount: 0 };
  private ordersByStatus: OrdersByStatus = new Map();
  topServices: ServiceStatsItem[] = [];

  get ordersInProgress(): number     { return this.ordersByStatus.get('IN_PROGRESS') ?? 0; }
  get ordersReady(): number          { return this.ordersByStatus.get('READY')       ?? 0; }
  get pendingPaymentsCount(): number { return this.ordersByStatus.get('PENDING_PAYMENT') ?? 0; }
  get totalActiveOrders(): number {
    return (this.ordersByStatus.get('BUDGETED')        ?? 0) +
           (this.ordersByStatus.get('PENDING_PAYMENT') ?? 0) +
           (this.ordersByStatus.get('IN_PROGRESS')     ?? 0) +
           (this.ordersByStatus.get('READY')           ?? 0);
  }

  // ── Chart state ──────────────────────────────────────────────────────────
  readonly periods: Array<{ key: PeriodKey; label: string }> = [
    { key: 'today', label: 'Hoy' },
    { key: 'week',  label: '7 días' },
    { key: 'month', label: 'Mes' },
  ];
  selectedPeriod: PeriodKey = 'week';
  loadingChart = true;
  chartError   = false;

  readonly chartW = C_W;
  readonly chartH = C_H;

  chartLinePath    = '';
  chartAreaPath    = '';
  chartPoints:  ChartPoint[]  = [];
  chartYLines:  ChartYLine[]  = [];
  chartXLabels: ChartXLabel[] = [];
  chartPeriodTotal = 0;
  get chartDailyAvg(): number {
    return this.chartPoints.length ? this.chartPeriodTotal / this.chartPoints.length : 0;
  }
  get periodLabel(): string {
    return { today: 'Hoy', week: '7 días', month: 'Este mes' }[this.selectedPeriod];
  }

  // ── Bar colors ───────────────────────────────────────────────────────────
  readonly barColors = SVC_COLORS;

  // ── Recent orders ────────────────────────────────────────────────────────
  loadingOrders = true;
  recentOrders: AdminOrder[] = [];

  // ── Pending payments ─────────────────────────────────────────────────────
  loadingPayments = true;
  pendingPayments: AdminPayment[] = [];

  // ── Init ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats();
    this.loadSalesTrend();
    this.loadRecentOrders();
    this.loadPendingPayments();
  }

  // ── Loaders ──────────────────────────────────────────────────────────────

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
        this.cd.markForCheck();
      },
      error: () => {
        this.loadingStats = false;
        this.statsError   = true;
        this.cd.markForCheck();
      },
    });
  }

  selectPeriod(p: PeriodKey): void {
    this.selectedPeriod = p;
    this.loadSalesTrend();
  }

  loadSalesTrend(): void {
    this.loadingChart = true;
    this.chartError   = false;
    const { from, to } = this.periodDates(this.selectedPeriod);
    this.statsService.getSalesTrend(from, to).subscribe({
      next: (trend) => {
        this.computeChart(trend);
        this.loadingChart = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loadingChart = false;
        this.chartError   = true;
        this.cd.markForCheck();
      },
    });
  }

  private loadRecentOrders(): void {
    this.loadingOrders = true;
    this.ordersService.getOrders({ status: '', from: '', to: '' }).subscribe({
      next: (orders) => {
        this.recentOrders  = orders.slice(0, 5);
        this.loadingOrders = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loadingOrders = false;
        this.cd.markForCheck();
      },
    });
  }

  private loadPendingPayments(): void {
    this.loadingPayments = true;
    this.paymentsService.getPendingPayments().subscribe({
      next: (res) => {
        this.pendingPayments  = Array.isArray(res) ? res : (res?.data ?? []);
        this.loadingPayments  = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loadingPayments = false;
        this.cd.markForCheck();
      },
    });
  }

  // ── Payment actions ───────────────────────────────────────────────────────
  approvePayment(pay: AdminPayment): void {
    this.paymentsService.approvePayment(pay.id).subscribe({
      next: () => {
        this.pendingPayments = this.pendingPayments.filter(p => p.id !== pay.id);
        this.cd.markForCheck();
      },
    });
  }

  rejectPayment(pay: AdminPayment): void {
    this.paymentsService.rejectPayment(pay.id, 'Rechazado desde dashboard').subscribe({
      next: () => {
        this.pendingPayments = this.pendingPayments.filter(p => p.id !== pay.id);
        this.cd.markForCheck();
      },
    });
  }

  // ── Chart computation ─────────────────────────────────────────────────────
  private computeChart(items: SalesTrendItem[]): void {
    if (!items.length) {
      this.chartPoints = []; this.chartLinePath = ''; this.chartAreaPath = '';
      this.chartYLines = []; this.chartXLabels = []; this.chartPeriodTotal = 0;
      return;
    }

    const maxRaw  = Math.max(...items.map(i => Number(i.total ?? 0)));
    const niceMax = this.niceMax(maxRaw);

    this.chartPoints = items.map((item, idx) => {
      const cx = C_PL + (items.length === 1 ? C_IW / 2 : (idx / (items.length - 1)) * C_IW);
      const cy = C_PT + C_IH - (Number(item.total ?? 0) / niceMax) * C_IH;
      return { cx, cy, dateLabel: this.fmtDate(item.date), totalFormatted: Number(item.total ?? 0).toFixed(2) };
    });

    const segs = this.chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
    this.chartLinePath = segs;
    const first = this.chartPoints[0], last = this.chartPoints[this.chartPoints.length - 1];
    this.chartAreaPath = `${segs} L${last.cx.toFixed(1)},${C_BLY} L${first.cx.toFixed(1)},${C_BLY} Z`;

    this.chartYLines = [0, 1/3, 2/3, 1].map(f => {
      const ly = C_PT + C_IH - f * C_IH;
      return { lineX1: C_PL, lineY: ly, lineX2: C_PL + C_IW, labelX: C_PL - 5, labelY: ly + 4, label: this.fmtCur(niceMax * f) };
    });

    const step = items.length <= 7 ? 1 : Math.ceil(items.length / 6);
    this.chartXLabels = items
      .map((item, idx) => ({
        x: C_PL + (items.length === 1 ? C_IW / 2 : (idx / (items.length - 1)) * C_IW),
        y: C_XLY,
        label: this.fmtDate(item.date),
        idx,
      }))
      .filter(xl => xl.idx % step === 0 || xl.idx === items.length - 1);

    this.chartPeriodTotal = items.reduce((s, i) => s + Number(i.total ?? 0), 0);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  getServiceLabel(item: ServiceStatsItem): string {
    return item.service_name ?? item.serviceName ?? item.name ?? 'Sin nombre';
  }

  getBarWidthPct(count: number | string): number {
    if (!this.topServices.length) return 0;
    const max = Math.max(...this.topServices.map(s => Number(s.count ?? 0)));
    return max > 0 ? Math.round((Number(count ?? 0) / max) * 100) : 0;
  }

  getBarPct(count: number | string): number {
    const total = this.topServices.reduce((s, item) => s + Number(item.count ?? 0), 0);
    return total > 0 ? Math.round((Number(count ?? 0) / total) * 100) : 0;
  }

  serviceColor(name: string): string { return svcColor(name); }

  clientInitials(name: string): string {
    const p = (name ?? '').trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  statusLabel(status: string): string {
    const m: Record<string, string> = {
      READY: 'Listo', IN_PROGRESS: 'En proceso', BUDGETED: 'Presupuestado',
      PENDING_PAYMENT: 'Pago pendiente', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
    };
    return m[status] ?? status;
  }

  statusClass(status: string): string {
    const m: Record<string, string> = {
      READY: 'listo', IN_PROGRESS: 'proceso', BUDGETED: 'cola',
      PENDING_PAYMENT: 'pago', DELIVERED: 'entregado', CANCELLED: 'cancelado',
    };
    return m[status] ?? '';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—'
      : d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  clientName(pay: AdminPayment): string {
    const c = pay.order?.client;
    if (!c) return 'Cliente';
    return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Cliente';
  }

  clientDni(pay: AdminPayment): string {
    return pay.order?.client?.dni ?? '';
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return 'Recibido recientemente';
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    if (mins  < 2)  return 'Recibido hace un momento';
    if (mins  < 60) return `Recibido hace ${mins} min`;
    if (hours < 24) return `Recibido hace ${hours} h`;
    return `Recibido el ${this.formatDate(dateStr)}`;
  }

  // ── Private helpers ──────────────────────────────────────────────────────
  private periodDates(p: PeriodKey): { from: string; to: string } {
    const now = new Date();
    const fmt = (d: Date) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    };
    const today = fmt(now);
    if (p === 'today') return { from: today, to: today };
    const past = new Date(now);
    past.setDate(now.getDate() - (p === 'week' ? 6 : 29));
    return { from: fmt(past), to: today };
  }

  private niceMax(v: number): number {
    if (v <= 0) return 100;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    return Math.ceil(v / mag) * mag;
  }

  private fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()}/${m[d.getMonth()]}`;
  }

  private fmtCur(v: number): string {
    if (v === 0) return 'S/0';
    if (v >= 1000) return `S/${(v / 1000).toFixed(1)}k`;
    return `S/${Math.round(v)}`;
  }
}
