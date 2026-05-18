import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { getUserName } from '../../../core/utils/jwt.utils';
import { OperatorService, OperatorOrder } from '../operator.service';

type UrgencyLevel = 'overdue' | 'urgent' | 'soon' | 'ok';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class OperatorDashboardComponent implements OnInit {
  private router          = inject(Router);
  private operatorService = inject(OperatorService);

  userName  = getUserName() || 'Operario';
  orders: OperatorOrder[] = [];
  isLoading = true;
  error: string | null = null;

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

        // Ordenar por fecha estimada de entrega ascendente (más urgente primero).
        // Pedidos sin fecha van al final.
        this.orders = all.sort((a, b) => {
          const tA = a.estimated_delivery_at
            ? new Date(a.estimated_delivery_at).getTime()
            : Infinity;
          const tB = b.estimated_delivery_at
            ? new Date(b.estimated_delivery_at).getTime()
            : Infinity;
          return tA - tB;
        });

        this.isLoading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los pedidos asignados.';
        this.isLoading = false;
      }
    });
  }

  // ── Contadores ─────────────────────────────────────────────────
  get activeCount(): number {
    return this.orders.filter(o => o.status === 'IN_PROGRESS').length;
  }

  get urgentCount(): number {
    return this.orders.filter(o => {
      const lvl = this.urgencyLevel(o);
      return o.status === 'IN_PROGRESS' && (lvl === 'overdue' || lvl === 'urgent');
    }).length;
  }

  get readyCount(): number {
    return this.orders.filter(o => o.status === 'READY').length;
  }

  // ── Lógica de urgencia ─────────────────────────────────────────
  urgencyLevel(order: OperatorOrder): UrgencyLevel {
    if (!order.estimated_delivery_at) return 'ok';
    const diff = this.diffDays(order.estimated_delivery_at);
    if (diff < 0)  return 'overdue';
    if (diff <= 1) return 'urgent';
    if (diff <= 3) return 'soon';
    return 'ok';
  }

  daysLabel(order: OperatorOrder): string {
    if (!order.estimated_delivery_at) return 'Sin fecha';
    const diff = this.diffDays(order.estimated_delivery_at);
    if (diff < 0)  return `Vencido hace ${Math.abs(diff)}d`;
    if (diff === 0) return 'Vence hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff} días`;
  }

  private diffDays(isoDate: string): number {
    const now      = new Date();
    const delivery = new Date(isoDate);
    return Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ── Etiquetas de estado ────────────────────────────────────────
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      IN_PROGRESS: 'En proceso',
      READY:       'Listo para recoger',
      DELIVERED:   'Entregado'
    };
    return map[status] ?? status;
  }

  // ── Logout ─────────────────────────────────────────────────────
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }
}
