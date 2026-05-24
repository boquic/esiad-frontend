import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientOrdersService, ClientOrder } from '../orders/orders.service';

@Component({
  selector: 'app-client-payments-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="shell">

  <!-- Page header -->
  <div class="page-head">
    <div class="title-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="2" y="6" width="20" height="13" rx="2"/>
        <path d="M2 10h20"/><path d="M6 15h3"/>
      </svg>
    </div>
    <div>
      <div class="page-title">Pagos</div>
      <div class="page-sub">Pedidos con pago pendiente de tu cuenta</div>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="isLoading" class="loading-state">
    <div class="spinner"></div>
    <p class="loading-text">Cargando pedidos...</p>
  </div>

  <!-- Error -->
  <div *ngIf="!isLoading && error" class="alert-error">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/><path d="M12 9v4M12 17h.01"/>
    </svg>
    <span>{{ error }}</span>
  </div>

  <!-- Sin pagos pendientes -->
  <div *ngIf="!isLoading && !error && pendingPaymentOrders.length === 0" class="empty-state">
    <div class="empty-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><path d="M6 15h3"/>
      </svg>
    </div>
    <p class="empty-title">Sin pagos pendientes</p>
    <p class="empty-sub">No tienes pedidos que requieran pago en este momento.</p>
    <a routerLink="/client/orders" class="btn-outline">Ver mis pedidos</a>
  </div>

  <!-- Lista de pagos pendientes -->
  <div *ngIf="!isLoading && !error && pendingPaymentOrders.length > 0">

    <!-- Aviso informativo -->
    <div class="info-banner">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
        <circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>
      </svg>
      <span>
        Tienes <strong>{{ pendingPaymentOrders.length }}</strong>
        {{ pendingPaymentOrders.length === 1 ? 'pedido pendiente de pago' : 'pedidos pendientes de pago' }}.
        Realiza el pago por Yape y sube la captura para que tu pedido avance a producción.
      </span>
    </div>

    <!-- Cards de pedidos -->
    <div class="orders-grid">
      <div *ngFor="let order of pendingPaymentOrders" class="order-card">

        <!-- Encabezado de la card -->
        <div class="card-header">
          <div class="card-header-left">
            <div class="order-code">#{{ order.id.slice(0,8).toUpperCase() }}</div>
            <span class="status-badge">
              <span class="status-dot"></span>
              Pago pendiente
            </span>
          </div>
          <div class="card-header-right">
            <div class="amount-label">{{ order.payment_condition === 'ADVANCE_50' ? 'Adelanto (50%)' : 'Total a pagar' }}</div>
            <div class="amount-value">
              <span class="cur">S/</span>{{ getAmountToPay(order) | number:'1.2-2' }}
            </div>
          </div>
        </div>

        <!-- Detalles del pedido -->
        <div class="card-body">
          <div class="detail-row">
            <span class="dk">Servicio</span>
            <span class="dv">{{ order.service_type?.name || order['serviceType']?.name || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="dk">Material</span>
            <span class="dv">{{ order.material?.name || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="dk">Total presupuestado</span>
            <span class="dv mono">S/ {{ (order.estimated_price ?? 0) | number:'1.2-2' }}</span>
          </div>
          <div class="detail-row" *ngIf="order.payment_condition === 'ADVANCE_50'">
            <span class="dk">Condición</span>
            <span class="dv">50% adelanto · 50% al recoger</span>
          </div>
        </div>

        <!-- Footer con acción -->
        <div class="card-footer">
          <a [routerLink]="['/client/orders', order.id, 'payment']" class="btn-pay">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>
            </svg>
            Pagar con Yape
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"/><path d="M13 5l7 7-7 7"/>
            </svg>
          </a>
          <a [routerLink]="['/client/orders', order.id]" class="btn-detail">
            Ver pedido
          </a>
        </div>

      </div>
    </div>

    <!-- Historial: pagos completados -->
    <div *ngIf="completedPaymentOrders.length > 0" class="history-section">
      <div class="history-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Pagos recientes confirmados
      </div>
      <div class="history-list">
        <div *ngFor="let order of completedPaymentOrders.slice(0, 5)" class="history-row">
          <div class="history-code mono">#{{ order.id.slice(0,8).toUpperCase() }}</div>
          <div class="history-service">{{ order.service_type?.name || order['serviceType']?.name || '—' }}</div>
          <div class="history-status">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2f855a" stroke-width="2.5">
              <path d="M5 12l5 5L20 7"/>
            </svg>
            En producción
          </div>
          <div class="history-amount mono">S/ {{ (order.estimated_price ?? 0) | number:'1.2-2' }}</div>
        </div>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    .shell {
      padding: 24px 36px 56px;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header */
    .page-head {
      display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
    }
    .title-icon {
      width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(58,143,139,0.18), rgba(46,120,116,0.10));
      color: #2e7874; display: grid; place-items: center;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.28);
    }
    .page-title { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: #2c2c2c; }
    .page-sub   { font-size: 13.5px; color: #666; margin-top: 4px; }

    /* Info banner */
    .info-banner {
      margin-bottom: 20px;
      background: rgba(58,143,139,0.08);
      border: 1px solid rgba(58,143,139,0.20);
      border-radius: 10px; padding: 11px 14px;
      display: flex; align-items: flex-start; gap: 9px;
      font-size: 13px; color: #2e7874; line-height: 1.5;
    }

    /* Grid */
    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    /* Order card */
    .order-card {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      box-shadow: 0 6px 24px -8px rgba(46,120,116,0.16), 0 1px 2px rgba(74,111,109,0.05);
      overflow: hidden;
      display: flex; flex-direction: column;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .order-card:hover {
      box-shadow: 0 10px 32px -8px rgba(46,120,116,0.26), 0 2px 4px rgba(74,111,109,0.08);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
      padding: 18px 20px 14px;
      border-bottom: 1px solid rgba(224,224,224,0.6);
      background: linear-gradient(180deg, rgba(58,143,139,0.07), transparent);
    }
    .card-header-left { display: flex; flex-direction: column; gap: 6px; }
    .order-code { font-family: 'Geist Mono', monospace; font-size: 15px; font-weight: 700; color: #2e7874; letter-spacing: 0.02em; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600;
      padding: 3px 9px; border-radius: 999px;
      color: #2e7874; background: rgba(58,143,139,0.12);
      border: 1px solid rgba(58,143,139,0.28);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .status-dot { width: 5px; height: 5px; border-radius: 50%; background: #3a8f8b; }

    .card-header-right { text-align: right; }
    .amount-label { font-size: 10.5px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
    .amount-value {
      font-family: 'Geist Mono', monospace;
      font-size: 26px; font-weight: 700;
      color: #2e7874; letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums; line-height: 1;
    }
    .amount-value .cur { font-size: 15px; font-weight: 600; opacity: .75; margin-right: 3px; vertical-align: 4px; }

    .card-body {
      padding: 14px 20px;
      display: flex; flex-direction: column; gap: 8px;
      flex: 1;
    }
    .detail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; }
    .dk { color: #666; font-weight: 500; flex-shrink: 0; }
    .dv { color: #2c2c2c; font-weight: 500; text-align: right; }
    .mono { font-family: 'Geist Mono', monospace; }

    .card-footer {
      padding: 14px 20px;
      border-top: 1px solid rgba(224,224,224,0.5);
      display: flex; align-items: center; gap: 10px;
    }
    .btn-pay {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      font-family: inherit; font-size: 13.5px; font-weight: 600;
      padding: 10px 16px; border-radius: 9px; cursor: pointer;
      text-decoration: none;
      background: linear-gradient(180deg, #3a8f8b, #2e7874);
      color: #fff; border: 1px solid #2e7874;
      box-shadow: 0 6px 16px -6px rgba(58,143,139,0.50);
      transition: filter 0.14s, transform 0.08s;
    }
    .btn-pay:hover   { filter: brightness(1.07); }
    .btn-pay:active  { transform: translateY(1px); }

    .btn-detail {
      display: inline-flex; align-items: center; justify-content: center;
      font-family: inherit; font-size: 13px; font-weight: 500;
      padding: 10px 14px; border-radius: 9px; cursor: pointer;
      text-decoration: none;
      background: rgba(255,255,255,0.60);
      color: #444; border: 1px solid #e0e0e0;
      transition: background 0.14s, border-color 0.14s;
    }
    .btn-detail:hover { background: #fff; border-color: #a8c0be; color: #2e7874; }

    /* History */
    .history-section {
      background: rgba(255,255,255,0.70);
      backdrop-filter: blur(16px);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 20px 24px;
    }
    .history-title {
      font-size: 14px; font-weight: 600; color: #444;
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(224,224,224,0.6);
    }
    .history-title svg { color: #3a8f8b; }
    .history-list { display: flex; flex-direction: column; gap: 2px; }
    .history-row {
      display: grid;
      grid-template-columns: 130px 1fr 130px 110px;
      gap: 12px;
      align-items: center;
      padding: 9px 10px;
      border-radius: 8px;
      font-size: 13px;
      transition: background 0.12s;
    }
    .history-row:hover { background: rgba(58,143,139,0.05); }
    .history-code   { font-weight: 700; color: #2e7874; }
    .history-service{ color: #444; }
    .history-status { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #2f855a; }
    .history-amount { text-align: right; font-weight: 600; color: #2c2c2c; }

    /* Alerts / States */
    .alert-error {
      display: flex; align-items: center; gap: 10px;
      background: #fff0f0; border: 1px solid #f5c6c6;
      border-radius: 12px; padding: 14px 16px;
      font-size: 13.5px; color: #c0392b; margin-bottom: 20px;
    }
    .empty-state {
      background: rgba(255,255,255,0.80);
      border: 1px solid #e0e0e0; border-radius: 14px;
      padding: 56px 32px; text-align: center;
    }
    .empty-icon {
      width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 16px;
      background: rgba(58,143,139,0.10); color: #3a8f8b;
      display: grid; place-items: center;
    }
    .empty-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .empty-sub   { font-size: 13.5px; color: #6b7280; margin-bottom: 20px; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: inherit; font-size: 13.5px; font-weight: 600;
      padding: 10px 20px; border-radius: 9px;
      text-decoration: none;
      background: rgba(255,255,255,0.70);
      color: #2e7874; border: 1px solid rgba(58,143,139,0.40);
      transition: background 0.14s, border-color 0.14s;
    }
    .btn-outline:hover { background: #fff; border-color: #3a8f8b; }

    .loading-state { padding: 60px 0; text-align: center; }
    .spinner {
      display: inline-block; width: 38px; height: 38px;
      border-radius: 50%;
      border: 3px solid #e5e7eb; border-top-color: #3a8f8b;
      animation: spin 0.75s linear infinite;
    }
    .loading-text { margin-top: 12px; font-size: 13.5px; color: #6b7280; }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 860px) {
      .shell { padding: 16px 18px 40px; }
      .orders-grid { grid-template-columns: 1fr; }
      .history-row { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class ClientPaymentsListComponent implements OnInit {
  private ordersService = inject(ClientOrdersService);

  isLoading = true;
  error: string | null = null;
  pendingPaymentOrders: ClientOrder[] = [];
  completedPaymentOrders: ClientOrder[] = [];

  ngOnInit(): void {
    this.ordersService.getMyOrders().subscribe({
      next: (response) => {
        const orders = this.ordersService.unwrapCollection(response);
        this.pendingPaymentOrders = orders.filter(o => o.status === 'PENDING_PAYMENT');
        this.completedPaymentOrders = orders.filter(
          o => ['IN_PROGRESS', 'READY', 'DELIVERED'].includes(o.status as string)
        );
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los pedidos.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  getAmountToPay(order: ClientOrder): number {
    if (order.payment_condition === 'ADVANCE_50') {
      return typeof order.advance_amount === 'number'
        ? order.advance_amount
        : Number(order.advance_amount ?? 0);
    }
    return typeof order.estimated_price === 'number'
      ? order.estimated_price
      : Number(order.estimated_price ?? 0);
  }
}
