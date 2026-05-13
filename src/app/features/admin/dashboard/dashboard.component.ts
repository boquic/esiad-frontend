import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen font-sans" style="background: #f4f5f6;">

      <!-- Navbar -->
      <nav style="background: white; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg width="28" height="32" viewBox="0 0 72 80" fill="none">
              <polygon points="4,76 26,4 36,4 18,76" fill="#3a8f8b"/>
              <polygon points="68,76 46,4 36,4 54,76" fill="#3a8f8b"/>
              <rect x="16" y="42" width="40" height="8" rx="1" fill="#3a8f8b"/>
            </svg>
            <div>
              <p class="font-bold text-sm tracking-widest uppercase" style="color: #2c2c2c; letter-spacing: 0.15em;">ESIAD ARQ</p>
              <p class="text-xs" style="color: #3a8f8b; letter-spacing: 0.08em;">Administración</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <a routerLink="/admin/services"
               class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               style="color: #3a8f8b;">
              Servicios
            </a>
            <a routerLink="/admin/materials"
               class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               style="color: #3a8f8b;">
              Materiales
            </a>
            <button (click)="logout()"
              class="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style="background: #3a8f8b;"
              onmouseover="this.style.background='#2e7874'" onmouseout="this.style.background='#3a8f8b'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <!-- Contenido -->
      <main class="max-w-7xl mx-auto px-6 py-10">

        <div class="mb-8">
          <h1 class="text-2xl font-bold" style="color: #1f2937;">Panel de Administración</h1>
          <p class="text-sm mt-1" style="color: #6b7280;">Gestiona los servicios, materiales y configuraciones del sistema.</p>
        </div>

        <!-- Accesos rápidos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

          <a routerLink="/admin/services"
             class="block rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Servicios</h2>
                <p class="text-xs" style="color: #6b7280;">Activar, editar y configurar servicios</p>
              </div>
            </div>
            <span class="text-sm font-medium" style="color: #3a8f8b;">Ir a Servicios →</span>
          </a>

          <a routerLink="/admin/materials"
             class="block rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-sm" style="color: #1f2937;">Gestionar Materiales</h2>
                <p class="text-xs" style="color: #6b7280;">Precios, disponibilidad y catálogo</p>
              </div>
            </div>
            <span class="text-sm font-medium" style="color: #3a8f8b;">Ir a Materiales →</span>
          </a>
        </div>

        <!-- Nota sprint -->
        <div class="rounded-xl p-5 flex items-start gap-4"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style="background: #f0fafa; border: 1px solid #b2dedd;">
            <svg class="w-4 h-4" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-sm" style="color: #1f2937;">Dashboard completo — Sprint 6</h3>
            <p class="text-sm mt-1 leading-relaxed" style="color: #6b7280;">
              Métricas generales, aprobación de pagos e indicadores del negocio estarán disponibles próximamente.
            </p>
          </div>
        </div>

      </main>
    </div>
  `
})
export class AdminDashboardComponent {
  private router = inject(Router);

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
