import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule],
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
              <p class="text-xs" style="color: #3a8f8b; letter-spacing: 0.08em;">Panel Operario</p>
            </div>
          </div>
          <button (click)="logout()"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style="background: #3a8f8b;"
            onmouseover="this.style.background='#2e7874'" onmouseout="this.style.background='#3a8f8b'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <!-- Contenido -->
      <main class="max-w-7xl mx-auto px-6 py-10">

        <div class="mb-8">
          <h1 class="text-2xl font-bold" style="color: #1f2937;">Panel de Operario</h1>
          <p class="text-sm mt-1" style="color: #6b7280;">Gestión de colas de trabajo y actualización de estados.</p>
        </div>

        <!-- Card próximamente -->
        <div class="rounded-xl p-8 flex flex-col items-center text-center max-w-lg mx-auto"
             style="background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">

          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style="background: #f0fafa; border: 1px solid #b2dedd;">
            <svg class="w-8 h-8" fill="none" stroke="#3a8f8b" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>

          <span class="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                style="background: #f0fafa; color: #3a8f8b; border: 1px solid #b2dedd; letter-spacing: 0.12em;">
            Sprint 4
          </span>

          <h2 class="text-lg font-bold mb-2" style="color: #1f2937;">Cola de Trabajo — Próximamente</h2>
          <p class="text-sm leading-relaxed" style="color: #6b7280;">
            En el Sprint 4 podrás ver tu cola de pedidos asignados por especialidad, descargar detalles y actualizar estados de producción.
          </p>
        </div>

      </main>
    </div>
  `
})
export class OperatorDashboardComponent {
  private router = inject(Router);

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
