import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminOrdersService, AdminOrder } from './admin-orders.service';

type StatusMeta = { label: string; classes: string };

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './admin-orders.component.html',
})
export class AdminOrdersComponent implements OnInit {
  private router  = inject(Router);
  private svc     = inject(AdminOrdersService);
  private cd = inject(ChangeDetectorRef);

  // ── Filter state (pending = not yet applied) ──────────────────────────
  selectedStatus = '';
  filterFrom     = '';
  filterTo       = '';

  // ── Applied filter state (shown as chips, used for active request) ────
  appliedStatus = '';
  appliedFrom   = '';
  appliedTo     = '';

  // ── Results state ─────────────────────────────────────────────────────
  loading = false;
  error   = false;
  orders: AdminOrder[] = [];

  // ── Status options ────────────────────────────────────────────────────
  readonly statusOptions: Array<{ value: string; label: string }> = [
    { value: '',                 label: 'Todos los estados'   },
    { value: 'BUDGETED',        label: 'Presupuestado'        },
    { value: 'PENDING_PAYMENT', label: 'Pago pendiente'       },
    { value: 'IN_PROGRESS',     label: 'En proceso'           },
    { value: 'READY',           label: 'Listo para recoger'   },
    { value: 'DELIVERED',       label: 'Entregado'            },
    { value: 'CANCELLED',       label: 'Cancelado'            },
    { value: 'EXPIRED',         label: 'Expirado'             },
  ];

  // ── Status badge metadata ─────────────────────────────────────────────
  private readonly statusMap: Record<string, StatusMeta> = {
    BUDGETED:        { label: 'Presupuestado',      classes: 'border-amber-300 bg-amber-50 text-amber-700'   },
    PENDING_PAYMENT: { label: 'Pago pendiente',     classes: 'border-orange-300 bg-orange-50 text-orange-700' },
    IN_PROGRESS:     { label: 'En proceso',         classes: 'border-blue-300 bg-blue-50 text-blue-700'      },
    READY:           { label: 'Listo para recoger', classes: 'border-green-300 bg-green-50 text-green-700'   },
    DELIVERED:       { label: 'Entregado',          classes: 'border-teal-300 bg-teal-50 text-teal-700'      },
    CANCELLED:       { label: 'Cancelado',          classes: 'border-red-200 bg-red-50 text-red-600'         },
    EXPIRED:         { label: 'Expirado',           classes: 'border-gray-300 bg-gray-100 text-gray-500'     },
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.applyFilters();
  }

  // ── Filter event handlers ─────────────────────────────────────────────

  onStatusChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
  }

  onFromChange(event: Event): void {
    this.filterFrom = (event.target as HTMLInputElement).value;
  }

  onToChange(event: Event): void {
    this.filterTo = (event.target as HTMLInputElement).value;
  }

  applyFilters(): void {
    this.appliedStatus = this.selectedStatus;
    this.appliedFrom   = this.filterFrom;
    this.appliedTo     = this.filterTo;
    this.loadOrders();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.filterFrom     = '';
    this.filterTo       = '';
    this.appliedStatus  = '';
    this.appliedFrom    = '';
    this.appliedTo      = '';
    this.loadOrders();
  }

  clearStatus(): void {
    this.selectedStatus = '';
    this.appliedStatus  = '';
    this.loadOrders();
  }

  clearDates(): void {
    this.filterFrom   = '';
    this.filterTo     = '';
    this.appliedFrom  = '';
    this.appliedTo    = '';
    this.loadOrders();
  }

  // ── Data loading ──────────────────────────────────────────────────────

  private loadOrders(): void {
    this.loading = true;
    this.error   = false;

    this.svc
      .getOrders({
        status: this.appliedStatus,
        from:   this.appliedFrom,
        to:     this.appliedTo,
      })
      .subscribe({
        next: (orders) => {
          this.orders  = orders;
          this.loading = false;
          this.cd.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.error   = true;
          this.cd.detectChanges();
        },
      });
  }

  // ── Template helpers ──────────────────────────────────────────────────

  getStatusMeta(status: string): StatusMeta {
    return (
      this.statusMap[status] ?? {
        label:   status,
        classes: 'border-gray-300 bg-gray-100 text-gray-500',
      }
    );
  }

  getStatusLabel(status: string): string {
    return this.statusMap[status]?.label ?? status;
  }

  // ── Auth ──────────────────────────────────────────────────────────────

  logout(): void {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
