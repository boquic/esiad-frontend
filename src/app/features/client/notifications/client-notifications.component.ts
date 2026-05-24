import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientOrdersService, ClientOrder } from '../orders/orders.service';

// ── Tipos ────────────────────────────────────────────────────────────────────

type NotifType = 'payment' | 'production' | 'ready' | 'delivered' | 'budget' | 'expired';

interface ClientNotification {
  id:          string;
  type:        NotifType;
  orderId:     string;
  orderCode:   string;
  title:       string;
  body:        string;
  timeAgo:     string;
  read:        boolean;
  actionLabel: string;
  actionRoute: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recientemente';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 2)  return 'Hace un momento';
  if (mins  < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days  < 7)  return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function orderCode(id: string): string {
  return '#' + id.slice(0, 8).toUpperCase();
}

function buildNotifications(orders: ClientOrder[]): ClientNotification[] {
  const notifs: ClientNotification[] = [];

  for (const o of orders) {
    const code    = orderCode(o.id);
    const date    = (o['updated_at'] ?? o['created_at']) as string | null;
    const ago     = timeAgo(date);

    switch (o.status) {
      case 'PENDING_PAYMENT':
        notifs.push({
          id:          `pay-${o.id}`,
          type:        'payment',
          orderId:     o.id,
          orderCode:   code,
          title:       'Pago pendiente requerido',
          body:        `Tu pedido ${code} tiene un presupuesto aprobado. Realiza el pago por Yape para que pase a producción.`,
          timeAgo:     ago,
          read:        false,
          actionLabel: 'Realizar pago',
          actionRoute: ['/client/orders', o.id, 'payment'],
        });
        break;

      case 'IN_PROGRESS':
        notifs.push({
          id:          `prod-${o.id}`,
          type:        'production',
          orderId:     o.id,
          orderCode:   code,
          title:       'Pedido en producción',
          body:        `Tu pedido ${code} ya está siendo procesado. Te avisaremos cuando esté listo para recoger.`,
          timeAgo:     ago,
          read:        false,
          actionLabel: 'Ver pedido',
          actionRoute: ['/client/orders', o.id],
        });
        break;

      case 'READY':
        notifs.push({
          id:          `ready-${o.id}`,
          type:        'ready',
          orderId:     o.id,
          orderCode:   code,
          title:       '¡Pedido listo para recoger!',
          body:        `Tu pedido ${code} está terminado. Acércate a nuestra tienda con tu DNI. Horario: lunes a sábado 9:00 – 19:00.`,
          timeAgo:     ago,
          read:        false,
          actionLabel: 'Ver detalle',
          actionRoute: ['/client/orders', o.id],
        });
        break;

      case 'DELIVERED':
        notifs.push({
          id:          `del-${o.id}`,
          type:        'delivered',
          orderId:     o.id,
          orderCode:   code,
          title:       'Pedido entregado',
          body:        `Tu pedido ${code} fue entregado exitosamente. ¡Gracias por confiar en ESIAD ARQ!`,
          timeAgo:     ago,
          read:        true,
          actionLabel: 'Ver historial',
          actionRoute: ['/client/orders', o.id],
        });
        break;

      case 'BUDGETED':
        notifs.push({
          id:          `bud-${o.id}`,
          type:        'budget',
          orderId:     o.id,
          orderCode:   code,
          title:       'Presupuesto recibido',
          body:        `Hemos preparado un presupuesto para tu pedido ${code}. Revísalo y realiza el pago para continuar.`,
          timeAgo:     ago,
          read:        true,
          actionLabel: 'Ver pedido',
          actionRoute: ['/client/orders', o.id],
        });
        break;

      case 'EXPIRED':
        notifs.push({
          id:          `exp-${o.id}`,
          type:        'expired',
          orderId:     o.id,
          orderCode:   code,
          title:       'Presupuesto vencido',
          body:        `El presupuesto de tu pedido ${code} ha vencido. Puedes crear un nuevo pedido si aún necesitas el servicio.`,
          timeAgo:     ago,
          read:        true,
          actionLabel: 'Nuevo pedido',
          actionRoute: ['/client/orders/new'],
        });
        break;
    }
  }

  // Más recientes primero (unread al frente)
  return notifs.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return 0;
  });
}

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-client-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="shell">

  <!-- Page header -->
  <div class="page-head">
    <div class="title-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>
        <path d="M10 21a2 2 0 0 0 4 0"/>
      </svg>
    </div>
    <div class="page-head-text">
      <div class="page-title">Notificaciones</div>
      <div class="page-sub">Actualizaciones de tus pedidos y cuenta</div>
    </div>

    <!-- Acción: marcar todas leídas -->
    <button *ngIf="unreadCount > 0"
            class="mark-all-btn"
            (click)="markAllRead()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 12l5 5L20 7"/>
      </svg>
      Marcar todas como leídas
    </button>
  </div>

  <!-- Filtros -->
  <div class="filters" *ngIf="!isLoading && !error && allNotifications.length > 0">
    <button *ngFor="let f of filters"
            class="filter-btn"
            [class.filter-active]="activeFilter === f.key"
            (click)="activeFilter = f.key">
      {{ f.label }}
      <span *ngIf="f.count > 0" class="filter-count">{{ f.count }}</span>
    </button>
  </div>

  <!-- Loading -->
  <div *ngIf="isLoading" class="loading-state">
    <div class="spinner"></div>
    <p class="loading-text">Cargando notificaciones...</p>
  </div>

  <!-- Error -->
  <div *ngIf="!isLoading && error" class="alert-error">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/><path d="M12 9v4M12 17h.01"/>
    </svg>
    <span>{{ error }}</span>
  </div>

  <!-- Sin notificaciones -->
  <div *ngIf="!isLoading && !error && filtered.length === 0" class="empty-state">
    <div class="empty-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>
        <path d="M10 21a2 2 0 0 0 4 0"/>
      </svg>
    </div>
    <p class="empty-title">
      {{ activeFilter === 'unread' ? 'Sin notificaciones sin leer' : 'Sin notificaciones' }}
    </p>
    <p class="empty-sub">
      {{ activeFilter === 'unread'
        ? 'Todas tus notificaciones han sido revisadas.'
        : 'Cuando haya novedades sobre tus pedidos, aparecerán aquí.' }}
    </p>
    <a *ngIf="activeFilter !== 'unread'" routerLink="/client/orders/new" class="btn-outline">
      Crear un pedido
    </a>
    <button *ngIf="activeFilter === 'unread'" class="btn-outline" (click)="activeFilter = 'all'">
      Ver todas las notificaciones
    </button>
  </div>

  <!-- Lista de notificaciones -->
  <div *ngIf="!isLoading && !error && filtered.length > 0" class="notif-list">
    <div *ngFor="let n of filtered; trackBy: trackById"
         class="notif-card"
         [class.notif-unread]="!n.read"
         [class.notif-payment]="n.type === 'payment'"
         [class.notif-ready]="n.type === 'ready'"
         [class.notif-production]="n.type === 'production'"
         [class.notif-delivered]="n.type === 'delivered'"
         [class.notif-budget]="n.type === 'budget'"
         [class.notif-expired]="n.type === 'expired'">

      <!-- Indicador no leído -->
      <div *ngIf="!n.read" class="unread-dot"></div>

      <!-- Icono tipo -->
      <div class="notif-icon">
        <!-- payment -->
        <svg *ngIf="n.type === 'payment'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><path d="M6 15h3"/>
        </svg>
        <!-- ready -->
        <svg *ngIf="n.type === 'ready'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <!-- production -->
        <svg *ngIf="n.type === 'production'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M3 21h18"/><path d="M6 21V13a6 6 0 1 1 12 0v8"/>
        </svg>
        <!-- delivered -->
        <svg *ngIf="n.type === 'delivered'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12l5 5L20 7"/>
        </svg>
        <!-- budget -->
        <svg *ngIf="n.type === 'budget'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2h9l5 5v15H6V2z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>
        </svg>
        <!-- expired -->
        <svg *ngIf="n.type === 'expired'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
        </svg>
      </div>

      <!-- Contenido -->
      <div class="notif-body">
        <div class="notif-top">
          <span class="notif-title">{{ n.title }}</span>
          <span class="notif-time">{{ n.timeAgo }}</span>
        </div>
        <p class="notif-text">{{ n.body }}</p>
        <div class="notif-footer">
          <span class="notif-order-chip">{{ n.orderCode }}</span>
          <a [routerLink]="n.actionRoute"
             class="notif-action"
             (click)="markRead(n)">
            {{ n.actionLabel }}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"/><path d="M13 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Botón marcar leída -->
      <button *ngIf="!n.read"
              class="read-btn"
              title="Marcar como leída"
              (click)="markRead(n)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12l5 5L20 7"/>
        </svg>
      </button>

    </div>
  </div>

  <!-- Tip inferior -->
  <div *ngIf="!isLoading && !error && allNotifications.length > 0" class="bottom-tip">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>
    </svg>
    Las notificaciones se generan automáticamente según el estado de tus pedidos.
  </div>

</div>
  `,
  styles: [`
    .shell {
      padding: 24px 36px 56px;
      max-width: 820px;
      margin: 0 auto;
    }

    /* ── Header ────────────────────────────────────────────── */
    .page-head {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
      flex-wrap: wrap;
    }
    .title-icon {
      width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(58,143,139,0.18), rgba(46,120,116,0.10));
      color: #2e7874; display: grid; place-items: center;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.28);
    }
    .page-head-text { flex: 1; min-width: 0; }
    .page-title { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: #2c2c2c; }
    .page-sub   { font-size: 13.5px; color: #666; margin-top: 4px; }

    .mark-all-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: inherit; font-size: 12.5px; font-weight: 600;
      padding: 8px 14px; border-radius: 8px; cursor: pointer;
      background: rgba(255,255,255,0.65);
      color: #2e7874; border: 1px solid rgba(58,143,139,0.35);
      transition: background 0.14s, border-color 0.14s;
      white-space: nowrap;
    }
    .mark-all-btn:hover { background: #fff; border-color: #3a8f8b; }

    /* ── Filters ───────────────────────────────────────────── */
    .filters {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .filter-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: inherit; font-size: 13px; font-weight: 500;
      padding: 7px 14px; border-radius: 8px; cursor: pointer;
      background: rgba(255,255,255,0.55);
      color: #555; border: 1px solid rgba(224,224,224,0.8);
      transition: background 0.13s, color 0.13s, border-color 0.13s;
    }
    .filter-btn:hover { background: rgba(255,255,255,0.80); color: #2e7874; border-color: #a8c0be; }
    .filter-active {
      background: rgba(58,143,139,0.12) !important;
      color: #2e7874 !important;
      border-color: rgba(58,143,139,0.35) !important;
      font-weight: 600 !important;
    }
    .filter-count {
      min-width: 18px; height: 18px; padding: 0 5px;
      background: #3a8f8b; color: #fff;
      border-radius: 999px; font-size: 11px; font-weight: 700;
      font-family: 'Geist Mono', monospace;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .filter-active .filter-count { background: #2e7874; }

    /* ── Notification list ─────────────────────────────────── */
    .notif-list { display: flex; flex-direction: column; gap: 10px; }

    .notif-card {
      display: flex; align-items: flex-start; gap: 14px;
      position: relative;
      background: rgba(255,255,255,0.78);
      backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%);
      border: 1px solid rgba(224,224,224,0.7);
      border-radius: 14px; padding: 18px 20px;
      box-shadow: 0 4px 16px -6px rgba(46,120,116,0.12), 0 1px 2px rgba(74,111,109,0.05);
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .notif-card:hover {
      box-shadow: 0 8px 24px -6px rgba(46,120,116,0.20), 0 2px 4px rgba(74,111,109,0.07);
      transform: translateY(-1px);
    }

    /* Unread highlight */
    .notif-unread {
      border-left: 3px solid #3a8f8b;
      padding-left: 17px;
    }

    /* Unread dot */
    .unread-dot {
      position: absolute; top: 16px; right: 16px;
      width: 8px; height: 8px; border-radius: 50%;
      background: #3a8f8b;
      box-shadow: 0 0 0 2px rgba(58,143,139,0.20);
    }

    /* Type icons */
    .notif-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: grid; place-items: center;
      background: rgba(58,143,139,0.10);
      color: #2e7874;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.18);
    }
    .notif-payment    .notif-icon { background: rgba(114,47,142,0.10); color: #722f8e; box-shadow: inset 0 0 0 1px rgba(114,47,142,0.18); }
    .notif-ready      .notif-icon { background: rgba(47,133,90,0.12);  color: #2f855a; box-shadow: inset 0 0 0 1px rgba(47,133,90,0.22); }
    .notif-delivered  .notif-icon { background: rgba(47,133,90,0.10);  color: #2f855a; box-shadow: inset 0 0 0 1px rgba(47,133,90,0.18); }
    .notif-expired    .notif-icon { background: rgba(184,134,11,0.10); color: #b8860b; box-shadow: inset 0 0 0 1px rgba(184,134,11,0.22); }
    .notif-production .notif-icon { background: rgba(58,143,139,0.12); color: #2e7874; }
    .notif-budget     .notif-icon { background: rgba(58,143,139,0.10); color: #2e7874; }

    /* Body */
    .notif-body { flex: 1; min-width: 0; }
    .notif-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 12px; margin-bottom: 5px;
    }
    .notif-title { font-size: 14px; font-weight: 600; color: #2c2c2c; line-height: 1.3; }
    .notif-time  { font-size: 11.5px; color: #999; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; }
    .notif-text  { font-size: 13px; color: #555; line-height: 1.5; margin: 0 0 10px; }

    .notif-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .notif-order-chip {
      font-family: 'Geist Mono', monospace; font-size: 11.5px; font-weight: 700;
      color: #2e7874; background: rgba(58,143,139,0.08);
      border: 1px solid rgba(58,143,139,0.22);
      padding: 2px 9px; border-radius: 999px;
    }
    .notif-payment .notif-order-chip { color: #722f8e; background: rgba(114,47,142,0.08); border-color: rgba(114,47,142,0.20); }
    .notif-ready   .notif-order-chip, .notif-delivered .notif-order-chip { color: #2f855a; background: rgba(47,133,90,0.08); border-color: rgba(47,133,90,0.20); }
    .notif-expired .notif-order-chip { color: #b8860b; background: rgba(184,134,11,0.08); border-color: rgba(184,134,11,0.20); }

    .notif-action {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12.5px; font-weight: 600; color: #3a8f8b;
      text-decoration: none;
      transition: color 0.13s;
    }
    .notif-action:hover { color: #2e7874; }
    .notif-payment   .notif-action { color: #722f8e; }
    .notif-payment   .notif-action:hover { color: #5b2374; }
    .notif-ready     .notif-action, .notif-delivered .notif-action { color: #2f855a; }
    .notif-expired   .notif-action { color: #b8860b; }

    /* Mark-read button */
    .read-btn {
      width: 28px; height: 28px; flex-shrink: 0; margin-top: 2px;
      display: grid; place-items: center; border-radius: 7px;
      background: rgba(58,143,139,0.08);
      border: 1px solid rgba(58,143,139,0.22);
      color: #3a8f8b; cursor: pointer;
      transition: background 0.13s;
    }
    .read-btn:hover { background: rgba(58,143,139,0.18); }

    /* ── Bottom tip ────────────────────────────────────────── */
    .bottom-tip {
      margin-top: 28px;
      display: flex; align-items: center; gap: 7px;
      font-size: 12px; color: #999; justify-content: center;
    }
    .bottom-tip svg { color: #3a8f8b; flex-shrink: 0; }

    /* ── Alerts / States ───────────────────────────────────── */
    .alert-error {
      display: flex; align-items: center; gap: 10px;
      background: #fff0f0; border: 1px solid #f5c6c6;
      border-radius: 12px; padding: 14px 16px;
      font-size: 13.5px; color: #c0392b;
    }
    .empty-state {
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(224,224,224,0.7);
      border-radius: 14px; padding: 60px 32px; text-align: center;
    }
    .empty-icon {
      width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 16px;
      background: rgba(58,143,139,0.10); color: #3a8f8b;
      display: grid; place-items: center;
    }
    .empty-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .empty-sub   { font-size: 13.5px; color: #6b7280; margin-bottom: 22px; line-height: 1.5; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: inherit; font-size: 13.5px; font-weight: 600;
      padding: 10px 20px; border-radius: 9px; text-decoration: none; cursor: pointer;
      background: rgba(255,255,255,0.70);
      color: #2e7874; border: 1px solid rgba(58,143,139,0.40);
      transition: background 0.14s, border-color 0.14s;
    }
    .btn-outline:hover { background: #fff; border-color: #3a8f8b; }

    /* ── Loading ───────────────────────────────────────────── */
    .loading-state { padding: 60px 0; text-align: center; }
    .spinner {
      display: inline-block; width: 38px; height: 38px;
      border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #3a8f8b;
      animation: spin 0.75s linear infinite;
    }
    .loading-text { margin-top: 12px; font-size: 13.5px; color: #6b7280; }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Responsive ────────────────────────────────────────── */
    @media (max-width: 700px) {
      .shell { padding: 16px 18px 40px; }
      .notif-top { flex-direction: column; gap: 2px; }
    }
  `]
})
export class ClientNotificationsComponent implements OnInit {
  private ordersService = inject(ClientOrdersService);
  private cd            = inject(ChangeDetectorRef);

  isLoading = true;
  error: string | null = null;

  allNotifications: ClientNotification[] = [];
  activeFilter: 'all' | 'unread' | 'payment' | 'updates' = 'all';

  get unreadCount(): number {
    return this.allNotifications.filter(n => !n.read).length;
  }

  get filters() {
    return [
      { key: 'all'     as const, label: 'Todas',           count: this.allNotifications.length },
      { key: 'unread'  as const, label: 'Sin leer',        count: this.unreadCount },
      { key: 'payment' as const, label: 'Pagos',           count: this.allNotifications.filter(n => n.type === 'payment').length },
      { key: 'updates' as const, label: 'Estado de pedido', count: this.allNotifications.filter(n => n.type !== 'payment').length },
    ].filter(f => f.key === 'all' || f.count > 0);
  }

  get filtered(): ClientNotification[] {
    switch (this.activeFilter) {
      case 'unread':  return this.allNotifications.filter(n => !n.read);
      case 'payment': return this.allNotifications.filter(n => n.type === 'payment');
      case 'updates': return this.allNotifications.filter(n => n.type !== 'payment');
      default:        return this.allNotifications;
    }
  }

  ngOnInit(): void {
    this.ordersService.getMyOrders().subscribe({
      next: (response) => {
        const orders = this.ordersService.unwrapCollection(response);
        this.allNotifications = buildNotifications(orders);
        this.isLoading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.error = 'Error al cargar las notificaciones.';
        this.isLoading = false;
        this.cd.markForCheck();
        console.error(err);
      }
    });
  }

  markRead(n: ClientNotification): void {
    n.read = true;
  }

  markAllRead(): void {
    this.allNotifications.forEach(n => (n.read = true));
  }

  trackById(_: number, n: ClientNotification): string {
    return n.id;
  }
}
