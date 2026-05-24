import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { getUserName } from '../../../core/utils/jwt.utils';
import { ClientOrdersService, ClientOrder } from '../orders/orders.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—'
    : d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recientemente';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 2)  return 'Hace un momento';
  if (mins  < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days  === 1) return 'Ayer';
  if (days  < 7)  return `Hace ${days} días`;
  return formatDate(dateStr);
}

/** Color determinista por nombre de servicio */
const SERVICE_COLORS = ['#2e7874','#3a8f8b','#a8c0be','#6b8f8c','#4a7a77','#5d8f89'];
function serviceColor(name: string | null | undefined): string {
  const hash = (name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return SERVICE_COLORS[hash % SERVICE_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class ClientDashboardComponent implements OnInit {
  private router       = inject(Router);
  private ordersSvc    = inject(ClientOrdersService);

  // ── User ──────────────────────────────────────────────────────────────────
  readonly userName: string = getUserName() || 'Usuario';

  get userFirstName(): string { return this.userName.split(' ')[0] ?? this.userName; }
  get userInitials(): string {
    const p = this.userName.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  // ── State ─────────────────────────────────────────────────────────────────
  isLoading = true;
  loadError = false;
  orders: ClientOrder[] = [];

  // ── Fecha dinámica ────────────────────────────────────────────────────────
  get todayLabel(): string {
    const now  = new Date();
    const day  = now.toLocaleDateString('es-PE', { weekday: 'long' });
    const date = now.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    // Capitaliza primer carácter
    return day.charAt(0).toUpperCase() + day.slice(1) + ', ' + date;
  }

  // ── KPIs calculados desde órdenes reales ──────────────────────────────────

  /** Pedidos activos: cualquier estado no terminal */
  get activeOrders(): number {
    return this.orders.filter(o =>
      ['BUDGETED', 'PENDING_PAYMENT', 'IN_PROGRESS', 'READY'].includes(o.status as string)
    ).length;
  }

  /** Desgloses para el subtexto de Pedidos activos */
  get inProgressCount(): number {
    return this.orders.filter(o => o.status === 'IN_PROGRESS').length;
  }
  get pendingPaymentCount(): number {
    return this.orders.filter(o => o.status === 'PENDING_PAYMENT').length;
  }
  get budgetedCount(): number {
    return this.orders.filter(o => o.status === 'BUDGETED').length;
  }

  get activeSubtext(): string {
    const parts: string[] = [];
    if (this.inProgressCount)     parts.push(`${this.inProgressCount} en proceso`);
    if (this.pendingPaymentCount) parts.push(`${this.pendingPaymentCount} pago pendiente`);
    if (this.budgetedCount)       parts.push(`${this.budgetedCount} presupuestado`);
    return parts.length ? parts.join(' · ') : 'Sin pedidos activos';
  }

  /** Listos para recoger */
  get readyOrders(): number {
    return this.orders.filter(o => o.status === 'READY').length;
  }

  /** Completados / entregados */
  get completedOrders(): number {
    return this.orders.filter(o => o.status === 'DELIVERED').length;
  }

  /** "desde {mes} {año}" del primer pedido entregado */
  get completedSinceLabel(): string {
    const delivered = this.orders
      .filter(o => o.status === 'DELIVERED')
      .map(o => new Date((o['created_at'] ?? o['updated_at']) as string))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (!delivered.length) return '';
    const d = delivered[0];
    return `desde ${d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}`;
  }

  // ── Notificación reciente (pedido más urgente) ─────────────────────────────

  get recentNotif(): { orderCode: string; title: string; message: string; timeAgo: string; orderId: string; actionRoute: string[]; type: 'ready' | 'payment' | 'progress' | 'budget' } | null {
    // Prioridad: READY > PENDING_PAYMENT > IN_PROGRESS > BUDGETED
    const priority: (string)[] = ['READY', 'PENDING_PAYMENT', 'IN_PROGRESS', 'BUDGETED'];

    for (const status of priority) {
      const o = this.orders.find(x => x.status === status);
      if (!o) continue;

      const code = '#' + o.id.slice(0, 8).toUpperCase();
      const ago  = timeAgo((o['updated_at'] ?? o['created_at']) as string);

      switch (status) {
        case 'READY':
          return {
            orderId:     o.id,
            orderCode:   code,
            type:        'ready',
            title:       `Tu pedido ${code} está listo para recoger`,
            message:     'Acércate a nuestra tienda con tu DNI. Horario: lunes a sábado de 9:00 a 19:00.',
            timeAgo:     ago,
            actionRoute: ['/client/orders', o.id],
          };
        case 'PENDING_PAYMENT':
          return {
            orderId:     o.id,
            orderCode:   code,
            type:        'payment',
            title:       `Tu pedido ${code} requiere pago`,
            message:     'Tu presupuesto fue aprobado. Realiza el pago por Yape para pasar a producción.',
            timeAgo:     ago,
            actionRoute: ['/client/orders', o.id, 'payment'],
          };
        case 'IN_PROGRESS':
          return {
            orderId:     o.id,
            orderCode:   code,
            type:        'progress',
            title:       `Tu pedido ${code} está en producción`,
            message:     'Estamos procesando tu pedido. Te notificaremos cuando esté listo para recoger.',
            timeAgo:     ago,
            actionRoute: ['/client/orders', o.id],
          };
        case 'BUDGETED':
          return {
            orderId:     o.id,
            orderCode:   code,
            type:        'budget',
            title:       `Presupuesto disponible para ${code}`,
            message:     'Hemos preparado tu presupuesto. Revísalo y apruébalo para continuar.',
            timeAgo:     ago,
            actionRoute: ['/client/orders', o.id],
          };
      }
    }
    return null;
  }

  // ── Pedidos recientes (últimos 4) ─────────────────────────────────────────

  get recentOrders(): ClientOrder[] {
    return this.orders.slice(0, 4);
  }

  // ── Helpers para la tabla ─────────────────────────────────────────────────

  orderCode(id: string): string {
    return '#' + id.slice(0, 8).toUpperCase();
  }

  serviceName(o: ClientOrder): string {
    return o.service_type?.name ?? (o['serviceType'] as any)?.name ?? '—';
  }

  serviceColor(o: ClientOrder): string {
    return serviceColor(this.serviceName(o));
  }

  materialName(o: ClientOrder): string {
    return o.material?.name ?? '—';
  }

  statusMeta(status: string): { label: string; color: string; bg: string; border: string } {
    switch (status) {
      case 'READY':           return { label: 'Listo para recoger', color: '#2f855a', bg: 'rgba(72,187,120,0.14)',    border: 'rgba(47,133,90,0.30)' };
      case 'IN_PROGRESS':     return { label: 'En proceso',         color: '#2e7874', bg: 'rgba(58,143,139,0.10)',    border: 'rgba(58,143,139,0.30)' };
      case 'PENDING_PAYMENT': return { label: 'Pago pendiente',     color: '#b8860b', bg: '#fff7e6',                  border: '#f5d39a' };
      case 'BUDGETED':        return { label: 'Presupuestado',      color: '#7c5cbf', bg: 'rgba(124,92,191,0.10)',    border: 'rgba(124,92,191,0.28)' };
      case 'DELIVERED':       return { label: 'Entregado',          color: '#666',    bg: 'rgba(136,136,136,0.10)',   border: 'rgba(136,136,136,0.20)' };
      case 'CANCELLED':       return { label: 'Cancelado',          color: '#c0392b', bg: 'rgba(192,57,43,0.08)',     border: 'rgba(192,57,43,0.22)' };
      case 'EXPIRED':         return { label: 'Vencido',            color: '#b8860b', bg: 'rgba(184,134,11,0.08)',    border: 'rgba(184,134,11,0.22)' };
      default:                return { label: status,               color: '#888',    bg: 'rgba(136,136,136,0.10)',   border: 'rgba(136,136,136,0.20)' };
    }
  }

  /** Texto para la columna "Fecha" según el estado */
  orderDateLabel(o: ClientOrder): string {
    const updated = (o['updated_at'] ?? o['created_at']) as string | null;
    switch (o.status) {
      case 'READY':
        return 'Disponible hoy';
      case 'PENDING_PAYMENT':
        const exp = o.budget_expires_at;
        return exp ? 'Vence ' + formatDate(exp) : 'Pago pendiente';
      case 'DELIVERED':
        return updated ? 'Entregado ' + formatDate(updated) : '—';
      default:
        return updated ? formatDate(updated) : '—';
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.ordersSvc.getMyOrders().subscribe({
      next: (res) => {
        // Ordenar: más recientes primero (por updated_at o created_at)
        this.orders = this.ordersSvc.unwrapCollection(res).sort((a, b) => {
          const da = new Date((a['updated_at'] ?? a['created_at']) as string).getTime();
          const db = new Date((b['updated_at'] ?? b['created_at']) as string).getTime();
          return db - da;
        });
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '?');
  }
}
