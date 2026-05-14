import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OperatorService, OperatorOrder } from '../operator.service';

@Component({
  selector: 'app-operator-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './operator-history.component.html'
})
export class OperatorHistoryComponent implements OnInit {
  private operatorService = inject(OperatorService);

  historyOrders: OperatorOrder[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.error = null;
    
    // Asumimos que sin parámetros trae todos o que podemos filtrar localmente.
    // También podríamos tener un endpoint específico si el backend lo soporta.
    this.operatorService.getAssignedOrders().subscribe({
      next: (response) => {
        const allOrders = Array.isArray(response) ? response : (response?.data || []);
        // Filtramos solo los pedidos que ya pasaron por el operario (READY o DELIVERED)
        this.historyOrders = allOrders.filter(o => o.status === 'READY' || o.status === 'DELIVERED');
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el historial de pedidos.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  get completedCount(): number {
    return this.historyOrders.length;
  }
}
