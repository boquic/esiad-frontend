import { Component, inject, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getUserName } from '../../../core/utils/jwt.utils';
import { OperatorService, OperatorOrder } from '../operator.service';

type UrgencyLevel = 'overdue' | 'urgent' | 'soon' | 'ok';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    /* ── Page shell ───────────────────────────────────────────── */
    .op-page {
      padding: 28px 36px 56px;
      max-width: 1280px;
      width: 100%;
      box-sizing: border-box;
    }

    /* ── Page header ──────────────────────────────────────────── */
    .op-page-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 22px;
      gap: 24px;
      flex-wrap: wrap;
    }
    .op-title-row {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .op-page-title {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: #2c2c2c;
      margin: 0;
    }
    .op-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(255,255,255,0.75);
      border: 1px solid #e0e0e0;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 600;
      color: #2e7874;
      box-shadow: 0 1px 2px rgba(74,111,109,0.08);
    }
    .op-count-badge::before {
      content:"";
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #3a8f8b;
      box-shadow: 0 0 0 3px rgba(58,143,139,0.18);
    }
    .op-page-sub {
      font-size: 13px;
      color: #666;
      margin-top: 6px;
    }
    .op-greeting {
      background: rgba(255,255,255,0.40);
      border: 1px solid rgba(255,255,255,0.55);
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 13px;
      color: #333;
      backdrop-filter: blur(12px);
      white-space: nowrap;
    }
    .op-greeting b { color: #2e7874; }

    /* ── Filters ──────────────────────────────────────────────── */
    .op-filters {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 1px 2px rgba(74,111,109,0.08);
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .op-filters-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .op-filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .op-filter-group label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    .op-select {
      appearance: none;
      -webkit-appearance: none;
      background: rgba(240,240,240,0.80);
      border: 1px solid #e0e0e0;
      color: #2c2c2c;
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 32px 8px 12px;
      border-radius: 8px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5'><path d='M6 9l6 6 6-6'/></svg>");
      background-repeat: no-repeat;
      background-position: right 10px center;
      cursor: pointer;
    }
    .op-select:focus {
      outline: 0;
      border-color: #3a8f8b;
      box-shadow: 0 0 0 3px rgba(58,143,139,0.18);
      background-color: #fff;
    }
    .op-filters-divider {
      width: 1px; height: 22px;
      background: #e0e0e0;
    }
    .op-filters-info {
      margin-left: auto;
      font-size: 12px;
      color: #888;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Alerts ───────────────────────────────────────────────── */
    .op-alert-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 10px;
      background: #fff0f0;
      border: 1px solid #f5c6c6;
      color: #c0392b;
      font-size: 13px;
      margin-bottom: 16px;
    }

    /* ── Loading ──────────────────────────────────────────────── */
    .op-loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 56px;
      font-size: 13px;
      color: #666;
    }
    .op-spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(58,143,139,0.25);
      border-top-color: #3a8f8b;
      border-radius: 50%;
      animation: opSpin .7s linear infinite;
    }
    @keyframes opSpin { to { transform: rotate(360deg); } }
    .op-spin-sm {
      display: inline-block;
      width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: opSpin .7s linear infinite;
    }

    /* ── Empty ────────────────────────────────────────────────── */
    .op-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 56px 24px;
      text-align: center;
      color: #888;
    }
    .op-empty svg { opacity: .4; }
    .op-empty-title { font-size: 15px; font-weight: 600; color: #444; margin: 0; }
    .op-empty-sub   { font-size: 13px; color: #888; margin: 0; }

    /* ── Order cards ──────────────────────────────────────────── */
    .op-orders { display: flex; flex-direction: column; gap: 14px; }

    .op-order {
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      box-shadow: 0 6px 24px -8px rgba(46,120,116,0.18), 0 1px 2px rgba(74,111,109,0.06);
      display: grid;
      grid-template-columns: 6px 1fr auto;
      overflow: hidden;
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .op-order:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 32px -12px rgba(46,120,116,0.25), 0 1px 2px rgba(74,111,109,0.08);
    }
    .op-order.urgent { border-color: #f5c6c6; }

    .op-urgency-bar { background: transparent; }
    .op-order.urgent .op-urgency-bar {
      background: linear-gradient(180deg,#e74c3c,#c0392b);
    }

    .op-order-body {
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 48px 1fr;
      gap: 18px;
      align-items: start;
    }
    .op-svc-icon {
      width: 48px; height: 48px;
      border-radius: 11px;
      background: linear-gradient(135deg,rgba(58,143,139,0.16),rgba(46,120,116,0.10));
      color: #2e7874;
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.25);
      flex-shrink: 0;
    }

    .op-order-main { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .op-order-top  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .op-order-code {
      font-family: 'Geist Mono', 'Courier New', monospace;
      font-size: 14px; font-weight: 700;
      color: #2c2c2c;
      letter-spacing: -0.01em;
    }

    .op-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px 3px 8px;
      border-radius: 999px;
      border: 1px solid transparent;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .op-badge::before {
      content: "";
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .op-badge.pendiente {
      color: #666;
      background: rgba(102,102,102,0.10);
      border-color: rgba(102,102,102,0.20);
    }
    .op-badge.proceso {
      color: #2e7874;
      background: rgba(58,143,139,0.14);
      border-color: rgba(58,143,139,0.30);
    }
    .op-badge.listo {
      color: #2f855a;
      background: rgba(72,187,120,0.14);
      border-color: rgba(47,133,90,0.30);
    }
    .op-badge.revision {
      color: #3730a3;
      background: rgba(99,102,241,0.14);
      border-color: rgba(99,102,241,0.35);
      animation: opdPulse 1.8s ease-in-out infinite;
    }
    @keyframes opdPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
      50% { box-shadow: 0 0 0 4px rgba(99,102,241,0.22); }
    }
    .op-badge.pago {
      color: #6d28d9;
      background: rgba(139,92,246,0.12);
      border-color: rgba(139,92,246,0.30);
    }
    .op-badge.urgent {
      color: #c0392b;
      background: #fff0f0;
      border-color: #f5c6c6;
      letter-spacing: 0.06em;
    }
    .op-badge.urgent::before {
      background: #e74c3c;
      box-shadow: 0 0 0 3px rgba(231,76,60,0.18);
    }

    .op-svc-type {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }
    .op-svc-type .sep { margin: 0 8px; color: #999; }

    .op-order-detail {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: 18px;
      margin-top: 4px;
      padding-top: 10px;
      border-top: 1px dashed #e0e0e0;
    }
    .op-detail-block { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .op-detail-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .op-detail-value {
      font-size: 13px;
      color: #2c2c2c;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 7px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .op-detail-value svg { color: #666; flex-shrink: 0; }
    .op-detail-value.urgent-text { color: #c0392b; font-weight: 600; }
    .op-detail-value.urgent-text svg { color: #c0392b; }

    .op-days-badge {
      display: inline-flex;
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 999px;
      background: rgba(102,102,102,0.12);
      color: #666;
      font-weight: 600;
      margin-left: 4px;
    }

    /* ── Order actions ────────────────────────────────────────── */
    .op-order-actions {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
      padding: 18px 22px 18px 4px;
      border-left: 1px solid rgba(224,224,224,0.65);
      background: rgba(255,255,255,0.25);
      min-width: 190px;
    }

    /* ── Buttons ──────────────────────────────────────────────── */
    .op-btn {
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 9px 16px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: background .14s, border-color .14s, color .14s, transform .08s;
      border: 1px solid transparent;
      text-decoration: none;
    }
    .op-btn:active { transform: translateY(1px); }
    .op-btn:disabled { opacity: .65; cursor: not-allowed; }
    .op-btn.primary {
      background: #3a8f8b;
      color: #fff;
      border-color: #2e7874;
      box-shadow: 0 6px 14px -6px rgba(58,143,139,0.55);
    }
    .op-btn.primary:hover:not(:disabled) { background: #2e7874; }
    .op-btn.success {
      background: #48bb78;
      color: #fff;
      border-color: #2f855a;
      box-shadow: 0 6px 14px -6px rgba(72,187,120,0.55);
    }
    .op-btn.success:hover:not(:disabled) { background: #2f855a; }
    .op-btn.ghost {
      background: transparent;
      color: #333;
      border-color: #e0e0e0;
    }
    .op-btn.ghost:hover { background: rgba(255,255,255,0.6); border-color: #a8c0be; color: #2e7874; }

    .op-ready-hint {
      font-size: 11px;
      color: #2f855a;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: center;
      margin-top: 2px;
    }

    /* ── Modal ────────────────────────────────────────────────── */
    .op-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
    }
    @keyframes opModalIn {
      from { opacity:0; transform:scale(0.95) translateY(-8px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
    .op-modal {
      background: #fff;
      border-radius: 20px;
      padding: 28px 24px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.22);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      animation: opModalIn 0.18s cubic-bezier(0.4,0,0.2,1);
    }
    .op-modal-icon {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: #f0fdf4;
      display: grid;
      place-items: center;
      margin-bottom: 4px;
    }
    .op-modal-title {
      font-size: 17px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }
    .op-modal-desc {
      font-size: 13.5px;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
    }
    .op-modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      width: 100%;
    }
    .op-modal-actions .op-btn { flex: 1; padding: 11px 16px; }

    @media (max-width: 1200px) {
      .op-order {
        grid-template-columns: 6px 1fr;
      }
      .op-order-actions {
        grid-column: 2;
        min-width: 0;
        border-left: 0;
        border-top: 1px solid rgba(224,224,224,0.65);
        padding: 16px 22px 18px;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
      }
      .op-order-actions .op-btn,
      .op-order-actions .op-ready-hint {
        flex: 1 1 160px;
      }
      .op-order-detail {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .op-detail-value {
        white-space: normal;
      }
    }

    @media (max-width: 900px) {
      .op-page {
        padding: 20px 18px 40px;
      }
      .op-page-head {
        gap: 14px;
      }
      .op-order-body {
        grid-template-columns: 1fr;
      }
      .op-svc-icon {
        width: 42px;
        height: 42px;
      }
      .op-order-main {
        gap: 10px;
      }
      .op-order-actions {
        padding: 16px 18px 18px;
      }
    }
  `],
})
export class OperatorDashboardComponent implements OnInit {
  private router          = inject(Router);
  private operatorService = inject(OperatorService);
  private cd              = inject(ChangeDetectorRef);

  userName  = getUserName() || 'Operario';
  orders: OperatorOrder[] = [];
  private loadingOrderId: string | null = null;
  isLoading = true;
  error: string | null = null;

  filterStatus  = '';
  filterUrgency = '';

  // Modal de confirmación para marcar listo
  confirmOrder: OperatorOrder | null = null;

  get firstName(): string {
    return this.userName.split(' ')[0];
  }

  get todayLabel(): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const d = new Date();
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
  }

  get filteredOrders(): OperatorOrder[] {
    return this.orders.filter(o => {
      if (this.filterStatus && o.status !== this.filterStatus) return false;
      if (this.filterUrgency === 'urgent') {
        const lvl = this.urgencyLevel(o);
        if (lvl !== 'overdue' && lvl !== 'urgent') return false;
      }
      if (this.filterUrgency === 'ok') {
        const lvl = this.urgencyLevel(o);
        if (lvl === 'overdue' || lvl === 'urgent') return false;
      }
      return true;
    });
  }

  ngOnInit(): void {
    this.loadAssignedOrders();
  }

  loadAssignedOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.operatorService.getAssignedOrders().subscribe({
      next: (response) => {
        const all: OperatorOrder[] = Array.isArray(response)
          ? response
          : (response?.data || []);

        const activeStatuses = new Set([
          'BUDGETED', 'CLIENT_REVIEW_PENDING', 'OPERATOR_REVIEW_PENDING',
          'PENDING_PAYMENT', 'IN_PROGRESS', 'READY'
        ]);
        this.orders = all
          .filter(o => activeStatuses.has(o.status))
          .sort((a, b) => {
            // OPERATOR_REVIEW_PENDING primero
            if (a.status === 'OPERATOR_REVIEW_PENDING' && b.status !== 'OPERATOR_REVIEW_PENDING') return -1;
            if (b.status === 'OPERATOR_REVIEW_PENDING' && a.status !== 'OPERATOR_REVIEW_PENDING') return 1;
            const tA = a.estimated_delivery_at ? new Date(a.estimated_delivery_at).getTime() : Infinity;
            const tB = b.estimated_delivery_at ? new Date(b.estimated_delivery_at).getTime() : Infinity;
            return tA - tB;
          });

        this.isLoading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.error = 'No se pudieron cargar los pedidos asignados.';
        this.isLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  // ── Urgency ───────────────────────────────────────────────────
  urgencyLevel(order: OperatorOrder): 'overdue' | 'urgent' | 'soon' | 'ok' {
    if (!order.estimated_delivery_at) return 'ok';
    const diff = this.diffDays(order.estimated_delivery_at);
    if (diff < 0)  return 'overdue';
    if (diff <= 1) return 'urgent';
    if (diff <= 3) return 'soon';
    return 'ok';
  }

  daysLabel(order: OperatorOrder): string {
    if (!order.estimated_delivery_at) return '';
    const diff = this.diffDays(order.estimated_delivery_at);
    if (diff < 0)   return `Vencido hace ${Math.abs(diff)}d`;
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff}d`;
  }

  private diffDays(isoDate: string): number {
    const now      = new Date();
    const delivery = new Date(isoDate);
    return Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ── Service type helpers ──────────────────────────────────────
  isLaser(order: OperatorOrder): boolean {
    return (order.service_type?.name || '').toLowerCase().includes('láser')
        || (order.service_type?.name || '').toLowerCase().includes('laser');
  }

  // ── Status ────────────────────────────────────────────────────
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      BUDGETED:                'Presupuestado',
      CLIENT_REVIEW_PENDING:   'Revisión cliente',
      OPERATOR_REVIEW_PENDING: 'Pendiente revisión',
      PENDING_PAYMENT:         'Pago pendiente',
      IN_PROGRESS:             'En producción',
      READY:                   'Listo',
      DELIVERED:               'Entregado',
      CANCELLED:               'Cancelado',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      BUDGETED:                'pendiente',
      CLIENT_REVIEW_PENDING:   'pendiente',
      OPERATOR_REVIEW_PENDING: 'revision',
      PENDING_PAYMENT:         'pago',
      IN_PROGRESS:             'proceso',
      READY:                   'listo',
    };
    return map[status] ?? '';
  }

  isOrderLoading(order: OperatorOrder): boolean {
    return this.loadingOrderId === order.id;
  }

  // ── Actions ──────────────────────────────────────────────────
  startOrder(order: OperatorOrder): void {
    this.loadingOrderId = order.id;
    this.operatorService.updateOrderStatus(order.id, 'IN_PROGRESS').subscribe({
      next: () => {
        order.status = 'IN_PROGRESS';
        this.loadingOrderId = null;
      },
      error: () => {
        this.loadingOrderId = null;
        this.error = 'No se pudo iniciar el pedido.';
      }
    });
  }

  markReady(order: OperatorOrder): void {
    this.confirmOrder = order;
  }

  cancelConfirm(): void {
    this.confirmOrder = null;
  }

  doMarkReady(): void {
    if (!this.confirmOrder) return;
    const order = this.confirmOrder;
    this.confirmOrder = null;
    this.loadingOrderId = order.id;

    this.operatorService.updateOrderStatus(order.id, 'READY').subscribe({
      next: () => {
        order.status = 'READY';
        this.loadingOrderId = null;
      },
      error: () => {
        this.loadingOrderId = null;
        this.error = 'No se pudo cambiar el estado del pedido.';
      }
    });
  }
}
