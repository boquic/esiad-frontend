import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getUserName } from '../../../core/utils/jwt.utils';

@Component({
  selector: 'app-operator-profile',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="opp-page">

  <!-- Header -->
  <div class="opp-page-head">
    <h1 class="opp-page-title">Mi perfil</h1>
    <p class="opp-page-sub">Información de tu cuenta y configuración del turno</p>
  </div>

  <div class="opp-grid">

    <!-- Profile card -->
    <section class="opp-card">
      <div class="opp-card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
        </svg>
        Datos personales
      </div>

      <div class="opp-profile-hero">
        <div class="opp-avatar-lg">{{ initials }}</div>
        <div>
          <div class="opp-hero-name">{{ userName }}</div>
          <div class="opp-hero-role">Operario de producción</div>
          <div class="opp-hero-turno">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
            </svg>
            Turno mañana · 07:00 – 15:00
          </div>
        </div>
      </div>

      <div class="opp-info-table">
        <div class="opp-info-row">
          <div class="opp-info-k">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
            </svg>
            Nombre completo
          </div>
          <div class="opp-info-v">{{ userName }}</div>
        </div>
        <div class="opp-info-row">
          <div class="opp-info-k">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/>
            </svg>
            Rol
          </div>
          <div class="opp-info-v">Operario</div>
        </div>
        <div class="opp-info-row">
          <div class="opp-info-k">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
            </svg>
            Turno
          </div>
          <div class="opp-info-v">Mañana · 07:00 – 15:00</div>
        </div>
      </div>
    </section>

    <!-- Especialidades -->
    <section class="opp-card">
      <div class="opp-card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/>
        </svg>
        Mis especialidades
      </div>

      <p class="opp-spec-hint">
        Solo verás pedidos que corresponden a tus especialidades asignadas.
      </p>

      <div class="opp-specs-grid">
        <div class="opp-spec-card active">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2v6"/><path d="M9 8h6l-1 4h-4z"/>
            <path d="M10 12v8"/><path d="M14 12v8"/>
            <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
          </svg>
          <div>
            <div class="opp-spec-name">Corte Láser</div>
            <div class="opp-spec-desc">Acrílico, MDF, madera, cuero</div>
          </div>
          <span class="opp-spec-badge">Activo</span>
        </div>

        <div class="opp-spec-card active">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="6" width="18" height="9" rx="1"/>
            <path d="M6 15v4M18 15v4"/><path d="M7 10h10M7 12h7"/>
          </svg>
          <div>
            <div class="opp-spec-name">Ploteo</div>
            <div class="opp-spec-desc">Papel, vinilo, planos arquitectónicos</div>
          </div>
          <span class="opp-spec-badge">Activo</span>
        </div>
      </div>

      <div class="opp-privacy-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
        </svg>
        Las especialidades son asignadas por el administrador del sistema.
      </div>
    </section>

  </div>
</div>
  `,
  styles: [`
    .opp-page {
      padding: 28px 36px 56px;
      max-width: 900px;
      width: 100%;
      box-sizing: border-box;
    }
    .opp-page-head { margin-bottom: 22px; }
    .opp-page-title {
      font-size: 24px; font-weight: 600;
      letter-spacing: -0.02em; color: #2c2c2c; margin: 0;
    }
    .opp-page-sub { font-size: 13px; color: #666; margin-top: 6px; }

    .opp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      align-items: start;
    }

    .opp-card {
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      box-shadow: 0 6px 24px -8px rgba(46,120,116,0.18), 0 1px 2px rgba(74,111,109,0.06);
      padding: 22px 24px;
    }
    .opp-card-title {
      font-size: 15px; font-weight: 600;
      color: #2c2c2c; display: flex; align-items: center; gap: 9px;
      margin-bottom: 18px; letter-spacing: -0.005em;
    }
    .opp-card-title svg { color: #2e7874; }

    /* Profile hero */
    .opp-profile-hero {
      display: flex; align-items: center; gap: 16px;
      padding: 16px; border-radius: 11px;
      background: rgba(255,255,255,0.55);
      border: 1px solid #e0e0e0;
      margin-bottom: 18px;
    }
    .opp-avatar-lg {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg,#3a8f8b,#2e7874);
      display: grid; place-items: center;
      font-size: 18px; font-weight: 700; color: #fff;
      box-shadow: inset 0 0 0 2px rgba(255,255,255,0.25);
      flex-shrink: 0;
    }
    .opp-hero-name  { font-size: 15px; font-weight: 700; color: #2c2c2c; }
    .opp-hero-role  { font-size: 12px; color: #666; margin-top: 2px; }
    .opp-hero-turno {
      display: flex; align-items: center; gap: 5px;
      font-size: 11.5px; color: #3a8f8b; font-weight: 500; margin-top: 6px;
    }

    /* Info table */
    .opp-info-table { display: flex; flex-direction: column; gap: 0; }
    .opp-info-row {
      display: grid; grid-template-columns: 180px 1fr;
      padding: 10px 0;
      border-bottom: 1px solid rgba(224,224,224,0.65);
      font-size: 13.5px;
    }
    .opp-info-row:last-child { border-bottom: 0; }
    .opp-info-k {
      color: #666; font-weight: 500;
      display: flex; align-items: center; gap: 7px;
    }
    .opp-info-k svg { color: #888; flex-shrink: 0; }
    .opp-info-v { color: #2c2c2c; font-weight: 500; }

    /* Specs */
    .opp-spec-hint {
      font-size: 12.5px; color: #666;
      margin-bottom: 14px; line-height: 1.5;
    }
    .opp-specs-grid { display: flex; flex-direction: column; gap: 10px; }
    .opp-spec-card {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; border-radius: 11px;
      background: rgba(58,143,139,0.06);
      border: 1px solid rgba(58,143,139,0.18);
    }
    .opp-spec-card svg { color: #2e7874; flex-shrink: 0; }
    .opp-spec-name { font-size: 13.5px; font-weight: 600; color: #2c2c2c; }
    .opp-spec-desc { font-size: 12px; color: #666; margin-top: 2px; }
    .opp-spec-badge {
      margin-left: auto;
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600;
      padding: 3px 10px; border-radius: 999px;
      color: #2f855a;
      background: rgba(72,187,120,0.14);
      border: 1px solid rgba(47,133,90,0.30);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .opp-spec-badge::before {
      content:""; width:6px; height:6px; border-radius:50%;
      background: #48bb78;
      box-shadow: 0 0 0 3px rgba(72,187,120,0.25);
    }

    .opp-privacy-note {
      display: flex; align-items: center; gap: 8px;
      margin-top: 14px; font-size: 12px; color: #888;
      padding: 9px 12px; border-radius: 8px;
      background: rgba(255,255,255,0.4);
      border: 1px dashed #e0e0e0;
    }
    .opp-privacy-note svg { color: #2e7874; flex-shrink: 0; }
  `],
})
export class OperatorProfileComponent {
  readonly userName: string = getUserName() || 'Operario';

  get initials(): string {
    const p = this.userName.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'OP';
  }
}
