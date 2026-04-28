import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col p-8 text-slate-100 font-sans relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>
      
      <header class="flex justify-between items-center mb-12 border-b border-slate-800 pb-6 relative z-10">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Panel de Operario</h1>
          <p class="text-slate-400 mt-1">Gestión de colas de trabajo y estados</p>
        </div>
        <button (click)="logout()" class="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 rounded-xl border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main class="flex-grow flex items-center justify-center relative z-10">
        <div class="max-w-2xl text-center space-y-6 bg-slate-900/40 backdrop-blur-md p-10 rounded-3xl border border-slate-800/60 shadow-2xl">
          <div class="w-20 h-20 bg-emerald-900/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 mb-6 w-fit h-fit p-4">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-100">Próximamente: Cola de Trabajo (Sprint 4)</h2>
          <p class="text-slate-400 leading-relaxed">
            Actualmente nos encontramos en el Sprint 1 (Autenticación y Roles). En el Sprint 4 podrás ver tu cola de pedidos asignados por especialidad, descargar detalles y actualizar estados.
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
