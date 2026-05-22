import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { getUserName } from '../../../core/utils/jwt.utils';

// ── Order model (mock) ────────────────────────────────────────────────────────

type OrderStatus = 'listo' | 'proceso' | 'pago' | 'entregado';

interface Order {
  code:         string;
  service:      string;
  serviceColor: string;
  material:     string;
  status:       OrderStatus;
  statusLabel:  string;
  datePre:      string;  // text before the bold date part
  dateBold:     string;  // bold date fragment
  datePost:     string;  // text after the bold date part
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class ClientDashboardComponent {
  private router = inject(Router);

  // ── User ──────────────────────────────────────────────────────────────────

  readonly userName: string = getUserName() || 'Usuario';

  get userFirstName(): string {
    return this.userName.split(' ')[0] ?? this.userName;
  }

  get userInitials(): string {
    const parts = this.userName.trim().split(/\s+/);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? '').toUpperCase();
    return a + b;
  }

  // ── KPI counters (mock) ───────────────────────────────────────────────────

  readonly activeOrders    = 2;
  readonly readyOrders     = 1;
  readonly completedOrders = 7;
  readonly notifCount      = 1;
  readonly ordersBadge     = 9;

  // ── Recent notification (mock) ────────────────────────────────────────────

  readonly recentNotif = {
    orderCode: '#PED-0038',
    message:   'Acércate a nuestra tienda con tu DNI para retirarlo. Horario de atención: lunes a sábado de 9:00 a 19:00.',
    timeAgo:   'Hace 2 horas',
  };

  // ── Recent orders — last 4 (mock) ─────────────────────────────────────────

  readonly recentOrders: Order[] = [
    {
      code: '#PED-0038', service: 'Corte láser',  serviceColor: '#2e7874',
      material: 'Acrílico 5 mm · 6 piezas',
      status: 'listo',     statusLabel: 'Listo para recoger',
      datePre: 'Disponible ', dateBold: 'desde hoy', datePost: '',
    },
    {
      code: '#PED-0041', service: 'Ploteo',       serviceColor: '#3a8f8b',
      material: 'Papel bond A1 · 4 láminas',
      status: 'proceso',   statusLabel: 'En proceso',
      datePre: '', dateBold: 'Mañana', datePost: ' · 11:00',
    },
    {
      code: '#PED-0042', service: 'Impresión 3D', serviceColor: '#a8c0be',
      material: 'PLA blanco · pieza 14 cm',
      status: 'pago',      statusLabel: 'Pendiente de pago',
      datePre: '', dateBold: '21/05', datePost: ' · estimado',
    },
    {
      code: '#PED-0034', service: 'Maqueta',      serviceColor: '#6b8f8c',
      material: 'Cartón pluma · escala 1:100',
      status: 'entregado', statusLabel: 'Entregado',
      datePre: '', dateBold: '12/05', datePost: ' · 16:30',
    },
  ];

  // ── Active-route helper ───────────────────────────────────────────────────

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '?');
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }
}
