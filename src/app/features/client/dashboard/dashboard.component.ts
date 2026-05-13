import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
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
              <p class="text-xs" style="color: #3a8f8b; letter-spacing: 0.08em;">Portal Cliente</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <a routerLink="/client/orders"
               class="px-4 py-2 rounded-lg text-sm font-medium"
               style="color: #3a8f8b;">
              Mis Pedidos
            </a>
            <a routerLink="/client/orders/new"
               class="px-4 py-2 rounded-lg text-sm font-medium"
               style="color: #3a8f8b;">
              Nuevo Pedido
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
          <h1 class="text-2xl font-bold" style="color: #1f2937;">Bienvenido</h1>
          <p class="text-sm mt-1" style="color: #6b7280;">Gestiona tus pedidos y presupuestos de diseño y fabricación digital.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Card principal: flujo de pedido -->
          <div class="lg:col-span-2 rounded-xl p-6"
               style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">

            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #f0fafa; border: 1px solid #b2dedd;">
                <svg class="w-5 h-5" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-base" style="color: #1f2937;">Nuevo pedido con presupuesto instantáneo</h2>
                <p class="text-xs" style="color: #6b7280;">Selecciona servicio, material y obtén un presupuesto en tiempo real</p>
              </div>
            </div>

            <!-- Pasos -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div class="rounded-xl p-4" style="background: #f9fafb; border: 1px solid #f0f0f0;">
                <p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color: #3a8f8b;">Paso 1</p>
                <h3 class="font-semibold text-sm mb-1" style="color: #1f2937;">Servicio</h3>
                <p class="text-xs leading-5" style="color: #6b7280;">Elige entre los servicios activos del catálogo.</p>
              </div>
              <div class="rounded-xl p-4" style="background: #f9fafb; border: 1px solid #f0f0f0;">
                <p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color: #3a8f8b;">Paso 2</p>
                <h3 class="font-semibold text-sm mb-1" style="color: #1f2937;">Material</h3>
                <p class="text-xs leading-5" style="color: #6b7280;">Lista filtrada según el servicio elegido.</p>
              </div>
              <div class="rounded-xl p-4" style="background: #f9fafb; border: 1px solid #f0f0f0;">
                <p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color: #3a8f8b;">Paso 3</p>
                <h3 class="font-semibold text-sm mb-1" style="color: #1f2937;">Presupuesto</h3>
                <p class="text-xs leading-5" style="color: #6b7280;">Monto estimado que se recalcula en pantalla.</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <a routerLink="/client/orders/new"
                 class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                 style="background: #3a8f8b;"
                 onmouseover="this.style.background='#2e7874'" onmouseout="this.style.background='#3a8f8b'">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Nuevo pedido
              </a>
              <a routerLink="/client/orders"
                 class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                 style="color: #3a8f8b; border: 1px solid #b2dedd; background: #f0fafa;">
                Ver mis pedidos
              </a>
            </div>
          </div>

          <!-- Sidebar info -->
          <div class="rounded-xl p-6" style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
            <h3 class="font-semibold text-sm mb-4" style="color: #1f2937;">Información</h3>
            <ul class="space-y-3 text-sm" style="color: #6b7280;">
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Servicios activos del catálogo
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Material filtrado por servicio
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Presupuesto generado al instante
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Estado visible por pedido
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  `,
})
export class ClientDashboardComponent {
  private router = inject(Router);

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
