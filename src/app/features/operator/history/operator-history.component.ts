import { Component, inject, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OperatorService, OperatorOrder } from '../operator.service';

@Component({
  selector: 'app-operator-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './operator-history.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .oph-page {
      padding: 28px 36px 56px;
      max-width: 1280px;
      width: 100%;
      box-sizing: border-box;
    }
    .oph-page-head {
      display:flex; align-items:flex-end; justify-content:space-between;
      margin-bottom:22px; gap:24px; flex-wrap:wrap;
    }
    .oph-title-row {
      display:flex; align-items:center; gap:14px; flex-wrap:wrap;
    }
    .oph-page-title {
      font-size:24px; font-weight:600; letter-spacing:-0.02em;
      color:#2c2c2c; margin:0;
    }
    .oph-count-badge {
      display:inline-flex; align-items:center; gap:7px;
      background:rgba(255,255,255,0.75); border:1px solid #e0e0e0;
      padding:5px 12px; border-radius:999px;
      font-size:12.5px; font-weight:600; color:#2e7874;
      box-shadow:0 1px 2px rgba(74,111,109,0.08);
    }
    .oph-count-badge::before {
      content:""; width:7px; height:7px; border-radius:50%;
      background:#3a8f8b; box-shadow:0 0 0 3px rgba(58,143,139,0.18);
    }
    .oph-page-sub { font-size:13px; color:#666; margin-top:6px; }

    .oph-alert-error {
      display:flex; align-items:center; gap:8px;
      padding:12px 16px; border-radius:10px;
      background:#fff0f0; border:1px solid #f5c6c6; color:#c0392b;
      font-size:13px; margin-bottom:16px;
    }

    @keyframes ophSpin { to { transform:rotate(360deg); } }
    .oph-loading {
      display:flex; flex-direction:column; align-items:center;
      gap:12px; padding:56px; font-size:13px; color:#666;
    }
    .oph-spinner {
      width:32px; height:32px;
      border:3px solid rgba(58,143,139,0.25);
      border-top-color:#3a8f8b;
      border-radius:50%; animation:ophSpin .7s linear infinite;
    }

    .oph-empty {
      display:flex; flex-direction:column; align-items:center;
      gap:10px; padding:56px 24px; text-align:center; color:#888;
    }
    .oph-empty svg { opacity:.4; }
    .oph-empty-title { font-size:15px; font-weight:600; color:#444; margin:0; }
    .oph-empty-sub   { font-size:13px; color:#888; margin:0; }

    .oph-card {
      background:rgba(255,255,255,0.75);
      backdrop-filter:blur(20px) saturate(140%);
      -webkit-backdrop-filter:blur(20px) saturate(140%);
      border:1px solid #e0e0e0;
      border-radius:14px;
      box-shadow:0 6px 24px -8px rgba(46,120,116,0.18), 0 1px 2px rgba(74,111,109,0.06);
      overflow:hidden;
    }

    .oph-table-wrap { overflow-x:auto; }
    .oph-table {
      width:100%; border-collapse:collapse; font-size:13px;
    }
    .oph-table thead tr {
      background:rgba(58,143,139,0.90);
    }
    .oph-table thead th {
      padding:12px 18px; text-align:left;
      font-size:11.5px; font-weight:600;
      color:rgba(255,255,255,0.90);
      text-transform:uppercase; letter-spacing:0.06em;
      white-space:nowrap;
    }
    .oph-table tbody tr {
      border-bottom:1px solid rgba(224,224,224,0.6);
      transition:background .12s;
    }
    .oph-table tbody tr:last-child { border-bottom:0; }
    .oph-table tbody tr:hover { background:rgba(255,255,255,0.5); }
    .oph-table tbody td { padding:13px 18px; vertical-align:middle; }

    .oph-code {
      font-family:'Geist Mono','Courier New',monospace;
      font-size:12.5px; font-weight:700;
      padding:3px 8px; border-radius:6px;
      background:rgba(58,143,139,0.08);
      color:#2e7874;
    }
    .oph-cell-main  { color:#2c2c2c; font-weight:500; }
    .oph-cell-muted { color:#666; }
    .oph-cell-mono  { color:#444; font-family:'Geist Mono','Courier New',monospace; font-size:12.5px; }

    .oph-badge {
      display:inline-flex; align-items:center; gap:5px;
      font-size:11px; font-weight:600;
      padding:3px 10px; border-radius:999px;
      text-transform:uppercase; letter-spacing:0.04em;
      border:1px solid transparent;
    }
    .oph-badge::before {
      content:""; width:6px; height:6px; border-radius:50%; background:currentColor;
    }
    .oph-badge.ready {
      color:#2f855a; background:rgba(72,187,120,0.14); border-color:rgba(47,133,90,0.30);
    }
    .oph-badge.delivered {
      color:#1a5c7a; background:rgba(26,92,122,0.10); border-color:rgba(26,92,122,0.25);
    }

    .oph-link-btn {
      display:inline-flex; align-items:center; gap:5px;
      font-size:12.5px; font-weight:600; color:#3a8f8b;
      text-decoration:none; padding:5px 10px;
      border-radius:7px; transition:background .12s;
    }
    .oph-link-btn:hover { background:rgba(58,143,139,0.10); }
  `],
})
export class OperatorHistoryComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private cd              = inject(ChangeDetectorRef);

  historyOrders: OperatorOrder[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.error = null;

    this.operatorService.getAssignedOrders().subscribe({
      next: (response) => {
        const allOrders = Array.isArray(response) ? response : (response?.data || []);
        this.historyOrders = allOrders.filter(
          (o: OperatorOrder) => o.status === 'READY' || o.status === 'DELIVERED'
        );
        this.isLoading = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.error = 'Error al cargar el historial de pedidos.';
        this.isLoading = false;
        this.cd.markForCheck();
      }
    });
  }

  get completedCount(): number {
    return this.historyOrders.length;
  }
}
