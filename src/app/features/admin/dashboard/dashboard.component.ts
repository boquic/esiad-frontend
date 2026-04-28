import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col p-8 text-slate-100 font-sans relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute bottom-[10%] left-[20%] w-[60%] h-[60%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[180px] opacity-10 pointer-events-none"></div>
      
      <header class="flex justify-between items-center mb-12 border-b border-slate-800 pb-6 relative z-10">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Administración Central</h1>
          <p class="text-slate-400 mt-1">Control absoluto de SIGEPED</p>
        </div>
        <button (click)="logout()" class="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 rounded-xl border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main class="flex-grow flex items-center justify-center relative z-10">
        <div class="max-w-2xl text-center space-y-6 bg-slate-900/40 backdrop-blur-md p-10 rounded-3xl border border-slate-800/60 shadow-2xl">
          <div class="w-20 h-20 bg-purple-900/30 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/20 mb-6 w-fit h-fit p-4">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-100">Próximamente: Dashboard General (Sprint 6)</h2>
          <p class="text-slate-400 leading-relaxed">
            Actualmente nos encontramos en el Sprint 1 (Autenticación y Roles). En sprints posteriores podrás gestionar servicios (Sprint 2), aprobar pagos (Sprint 5) y ver métricas completas e indicadores del negocio (Sprint 6).
          </p>
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
