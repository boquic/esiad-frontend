import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { getUserName } from '../../../core/utils/jwt.utils';

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
            <svg width="28" height="32" viewBox="0 0 428 451" fill="none">
              <path fill="#3a8f8b" d="M338.218201,86.728973 C353.860413,151.408997 369.415833,215.680695 384.970825,279.952484 C387.940125,292.221436 390.840485,304.507690 393.925049,316.747589 C394.662476,319.673859 394.105865,321.338928 391.515656,323.246185 C342.889984,359.051361 294.370941,395.001282 245.788925,430.865936 C244.405899,431.886902 242.581299,432.899963 240.955338,432.911713 C221.480286,433.052277 202.003860,433.002502 182.064133,433.002502 C182.064133,369.740967 182.064133,306.692963 182.064133,243.220337 C156.523453,243.220337 131.440903,243.220337 105.658791,243.220337 C107.631348,233.665970 109.492691,224.650269 111.442642,215.205399 C134.681290,215.205399 157.934677,215.205399 181.565598,215.205399 C181.565598,166.064957 181.565598,117.367439 181.565598,68.412415 C164.102737,68.412415 146.678375,68.412415 128.855774,68.412415 C106.826164,160.918610 84.786568,253.466782 62.574501,346.739136 C52.508755,338.510223 43.018585,330.505005 33.227974,322.885803 C29.935354,320.323456 28.893690,318.130646 29.946138,313.832794 C53.059425,219.445343 75.996925,125.014824 98.885536,30.572559 C99.522644,27.943766 100.183640,26.612568 103.295311,26.619930 C148.620865,26.727163 193.946747,26.696535 239.272552,26.709229 C239.928421,26.709412 240.584259,26.842278 241.638443,26.956303 C241.638443,144.742249 241.638443,262.488373 241.638443,381.252350 C249.964066,375.501648 257.571014,370.298615 265.125244,365.020111 C292.395203,345.965363 319.629913,326.860107 346.938019,307.860291 C349.226624,306.267944 350.237488,305.023834 349.516388,301.890533 C331.778564,224.820679 314.192932,147.715790 296.481628,70.185921 C286.269318,70.185921 276.010834,70.185921 265.410156,70.185921 C265.410156,55.537655 265.410156,41.333363 265.410156,26.910526 C284.803619,26.910526 304.073669,26.910526 323.830353,26.910526 C328.590942,46.687450 333.361084,66.504066 338.218201,86.728973 z"/>
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
          <h1 class="text-2xl font-bold" style="color: #1f2937;">Bienvenido {{ userName || '' }}</h1>
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
  userName = getUserName() || 'Usuario';

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/login']);
  }
}
