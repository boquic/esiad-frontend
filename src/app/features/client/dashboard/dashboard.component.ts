import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex flex-col p-8 text-slate-100 font-sans relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>
      
      <header class="flex justify-between items-center mb-12 border-b border-slate-800 pb-6 relative z-10">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Portal de Cliente</h1>
          <p class="text-slate-400 mt-1">Bienvenido a su espacio personal en SIGEPED</p>
        </div>
        <button (click)="logout()" class="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 rounded-xl border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main class="flex-grow flex items-center justify-center relative z-10">
        <div class="max-w-2xl text-center space-y-6 bg-slate-900/40 backdrop-blur-md p-10 rounded-3xl border border-slate-800/60 shadow-2xl">
          <div class="w-20 h-20 bg-blue-900/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 mb-6 w-fit h-fit p-4">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-100">Próximamente: Flujo de Pedidos (Sprint 3)</h2>
          <p class="text-slate-400 leading-relaxed">
            Actualmente nos encontramos en el Sprint 1 (Autenticación y Roles). En el Sprint 3 podrás crear nuevos pedidos, subir planos y ver presupuestos en tiempo real.
          </p>
        </div>
      </main>
    </div>
  `
})
export class ClientDashboardComponent {
  private router = inject(Router);

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}
