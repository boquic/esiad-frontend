import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.24),_transparent_42%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] p-8 font-sans text-slate-100">
      <header class="relative z-10 mb-12 flex flex-col gap-6 border-b border-cyan-900/30 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.35em] text-cyan-300/70">SIGEPED</p>
          <h1 class="mt-3 bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Portal de Cliente
          </h1>
          <p class="mt-2 text-slate-300">Tu flujo de pedidos ya empieza a tomar forma en el Sprint 3.</p>
        </div>

        <button
          (click)="logout()"
          class="flex items-center space-x-2 rounded-2xl border border-slate-700 bg-slate-900/50 px-5 py-3 font-medium text-slate-200 transition-all hover:border-cyan-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span>Cerrar sesion</span>
        </button>
      </header>

      <main class="relative z-10 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section class="rounded-[32px] border border-slate-800/70 bg-slate-950/55 p-8 shadow-[0_20px_80px_rgba(8,15,30,0.45)] backdrop-blur-xl">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-300">
                <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>

              <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/75">Sprint 3</p>
              <h2 class="mt-3 text-3xl font-black tracking-tight text-white">Nuevo pedido con presupuesto instantaneo</h2>
              <p class="mt-4 text-base leading-7 text-slate-300">
                Ya puedes iniciar el flujo del cliente seleccionando servicio, material y la medida exacta que depende del modelo de precio configurado en el backend.
              </p>
            </div>

            <a
              routerLink="/client/orders/new"
              class="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Abrir formulario
            </a>
          </div>

          <div class="mt-8 grid gap-4 md:grid-cols-3">
            <div class="rounded-3xl border border-slate-800 bg-slate-900/50 p-5">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Paso 1</p>
              <h3 class="mt-3 text-lg font-bold text-white">Servicio</h3>
              <p class="mt-2 text-sm leading-6 text-slate-400">El cliente parte de servicios activos y visibles en catalogo.</p>
            </div>

            <div class="rounded-3xl border border-slate-800 bg-slate-900/50 p-5">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Paso 2</p>
              <h3 class="mt-3 text-lg font-bold text-white">Material</h3>
              <p class="mt-2 text-sm leading-6 text-slate-400">La lista se filtra segun el servicio elegido para evitar errores en la solicitud.</p>
            </div>

            <div class="rounded-3xl border border-slate-800 bg-slate-900/50 p-5">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Paso 3</p>
              <h3 class="mt-3 text-lg font-bold text-white">Presupuesto</h3>
              <p class="mt-2 text-sm leading-6 text-slate-400">El monto estimado se recalcula en pantalla a medida que cambian los datos del pedido.</p>
            </div>
          </div>
        </section>

        <aside class="rounded-[32px] border border-cyan-500/20 bg-cyan-500/10 p-8 backdrop-blur-xl">
          <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">Alcance actual</p>
          <h3 class="mt-3 text-2xl font-bold text-white">Solo lo solicitado</h3>
          <p class="mt-4 text-sm leading-7 text-slate-200">
            Esta iteracion se concentra unicamente en el formulario de nuevo pedido: servicio, material, campos dinamicos por
            <code>pricing_model</code> y preview en tiempo real.
          </p>
          <div class="mt-6 rounded-3xl border border-white/10 bg-slate-950/45 p-5 text-sm leading-6 text-slate-300">
            No se agregaron vistas de detalle, lista de pedidos, subida de archivos ni confirmacion de presupuesto, para mantenernos estrictamente dentro del alcance.
          </div>
        </aside>
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
