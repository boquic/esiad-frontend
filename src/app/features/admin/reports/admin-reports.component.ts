import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatsService } from '../dashboard/admin-stats.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.component.html'
})
export class AdminReportsComponent implements OnInit {
  private statsService = inject(AdminStatsService);

  topClients: any[] = [];
  operatorStats: any[] = [];
  
  isLoadingClients = true;
  isLoadingOperators = true;
  
  error: string | null = null;
  isExporting = false;

  ngOnInit(): void {
    this.loadClientsStats();
    this.loadOperatorsStats();
  }

  loadClientsStats(): void {
    this.isLoadingClients = true;
    this.statsService.getClientsStats().subscribe({
      next: (data) => {
        this.topClients = data;
        this.isLoadingClients = false;
      },
      error: (err) => {
        this.error = 'Error al cargar estadísticas de clientes.';
        this.isLoadingClients = false;
        console.error(err);
      }
    });
  }

  loadOperatorsStats(): void {
    this.isLoadingOperators = true;
    this.statsService.getOperatorsStats().subscribe({
      next: (data) => {
        this.operatorStats = data;
        this.isLoadingOperators = false;
      },
      error: (err) => {
        this.error = 'Error al cargar estadísticas de operarios.';
        this.isLoadingOperators = false;
        console.error(err);
      }
    });
  }

  exportClientsToExcel(): void {
    this.isExporting = true;
    try {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.topClients.map(c => ({
        'Nombre': c.first_name,
        'Apellidos': c.last_name,
        'DNI': c.dni,
        'Teléfono': c.phone,
        'Pedidos Exitosos': c.completed_orders_count,
        'Cliente Frecuente': c.is_frequent ? 'Sí' : 'No'
      })));

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Top Clientes');
      
      const fileName = `Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      this.error = 'Error al generar el archivo Excel.';
      console.error(e);
    } finally {
      this.isExporting = false;
    }
  }

  exportOperatorsToExcel(): void {
    this.isExporting = true;
    try {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.operatorStats.map(o => ({
        'Operario': `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.user?.first_name || 'Desconocido',
        'Pedidos Completados': o.completed_count || 0,
        'Tiempo Promedio (horas)': o.avg_time_hours || 0
      })));

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rendimiento Operarios');
      
      const fileName = `Reporte_Operarios_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      this.error = 'Error al generar el archivo Excel.';
      console.error(e);
    } finally {
      this.isExporting = false;
    }
  }
}
