import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OperatorService, OperatorOrder } from '../operator.service';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class OperatorDashboardComponent implements OnInit {
  private router = inject(Router);
  private operatorService = inject(OperatorService);

  orders: OperatorOrder[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAssignedOrders();
  }

  loadAssignedOrders(): void {
    this.isLoading = true;
    this.error = null;
    this.operatorService.getAssignedOrders('IN_PROGRESS').subscribe({
      next: (response) => {
        this.orders = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los pedidos asignados.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
