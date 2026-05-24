import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientOrdersService, ClientOrderDetail } from '../orders/orders.service';
import { ClientPaymentsService } from './payments.service';

@Component({
  selector: 'app-client-payment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-payment.component.html',
  styles: [`
    /* ── Shell ────────────────────────────────────────────── */
    .page-shell {
      padding: 24px 36px 56px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Breadcrumbs ──────────────────────────────────────── */
    .page-crumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: #666;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .page-crumbs a  { color: #666; text-decoration: none; }
    .page-crumbs a:hover { color: #2e7874; }
    .page-crumbs .sep  { color: #999; }
    .page-crumbs .here { color: #2c2c2c; font-weight: 600; }

    /* ── Page header ──────────────────────────────────────── */
    .page-head {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
    }
    .title-icon {
      width: 44px; height: 44px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(58,143,139,0.18), rgba(46,120,116,0.10));
      color: #2e7874;
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.28);
      flex-shrink: 0;
    }
    .page-title { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: #2c2c2c; }
    .page-sub   { font-size: 13.5px; color: #666; margin-top: 4px; }

    /* ── Grid ─────────────────────────────────────────────── */
    .pay-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      align-items: start;
    }
    .pay-col { display: flex; flex-direction: column; gap: 18px; }

    /* ── Card ─────────────────────────────────────────────── */
    .card {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 22px 24px;
      box-shadow: 0 6px 24px -8px rgba(46,120,116,0.18), 0 1px 2px rgba(74,111,109,0.06);
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.005em;
      color: #2c2c2c;
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .card-title svg { color: #2e7874; }

    /* ── Order rows ───────────────────────────────────────── */
    .order-rows {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px 14px;
      font-size: 13.5px;
      margin-bottom: 14px;
    }
    .order-rows .k { color: #666; font-weight: 500; }
    .order-rows .v { color: #2c2c2c; font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; }
    .order-rows .v.code { font-family: 'Geist Mono', monospace; font-weight: 600; color: #2e7874; }

    .total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-top: 1px solid rgba(224,224,224,0.65);
      font-size: 13.5px;
      color: #666;
    }
    .total-row .amount {
      font-family: 'Geist Mono', monospace;
      font-size: 15px;
      font-weight: 600;
      color: #2c2c2c;
      font-variant-numeric: tabular-nums;
    }

    /* ── Pay-now box ──────────────────────────────────────── */
    .pay-now-box {
      background: linear-gradient(180deg, rgba(58,143,139,0.10), rgba(58,143,139,0.05));
      border: 1px solid rgba(58,143,139,0.30);
      border-radius: 12px;
      padding: 18px 20px;
      margin-top: 10px;
    }
    .pay-now-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    .pay-now-label {
      font-size: 13px;
      color: #2e7874;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pay-now-amount {
      font-family: 'Geist Mono', monospace;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #2e7874;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .pay-now-amount .cur {
      font-size: 18px;
      font-weight: 600;
      color: #2e7874;
      opacity: .75;
      margin-right: 5px;
      vertical-align: 5px;
    }
    .pay-now-hint {
      font-size: 11.5px;
      color: #666;
      margin-top: 9px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pay-now-hint svg { color: #2e7874; }

    /* ── Meta / badge ─────────────────────────────────────── */
    .meta-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 11px 4px 9px;
      border-radius: 999px;
      color: #2e7874;
      background: rgba(58,143,139,0.08);
      border: 1px solid rgba(58,143,139,0.30);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-pill::before {
      content: "";
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #3a8f8b;
    }

    /* ── Warn row ─────────────────────────────────────────── */
    .warn-row {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff7e6;
      border: 1px solid #f5d39a;
      border-radius: 10px;
      padding: 10px 14px;
      margin-top: 14px;
      font-size: 13px;
      color: #b8860b;
      font-weight: 500;
    }
    .warn-row svg { flex-shrink: 0; }
    .warn-row b   { font-family: 'Geist Mono', monospace; }

    /* ── Steps ────────────────────────────────────────────── */
    .steps { display: flex; flex-direction: column; gap: 14px; margin-top: 4px; }
    .step  { display: grid; grid-template-columns: 36px 1fr; gap: 14px; align-items: start; }
    .step-num {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3a8f8b, #2e7874);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 6px 14px -6px rgba(58,143,139,0.5), inset 0 0 0 1px rgba(255,255,255,0.20);
      flex-shrink: 0;
    }
    .step-title { font-size: 13.5px; font-weight: 600; color: #2c2c2c; line-height: 1.35; }
    .step-sub   { font-size: 12.5px; color: #666; line-height: 1.45; margin-top: 3px; }
    .mono { font-family: 'Geist Mono', monospace; }

    .info-banner {
      margin-top: 16px;
      background: rgba(58,143,139,0.08);
      border: 1px solid rgba(58,143,139,0.20);
      border-radius: 10px;
      padding: 11px 14px;
      display: flex;
      align-items: flex-start;
      gap: 9px;
      font-size: 12.5px;
      color: #2e7874;
      line-height: 1.5;
    }

    /* ── Yape card ────────────────────────────────────────── */
    .yape-card {
      background: linear-gradient(160deg, rgba(255,255,255,0.88), rgba(255,255,255,0.70));
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 22px 24px;
      box-shadow: 0 6px 24px -8px rgba(46,120,116,0.18), 0 1px 2px rgba(74,111,109,0.06);
    }
    .yape-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .yape-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px 6px 6px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 999px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .yape-mark {
      width: 28px; height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #722f8e, #5b2374);
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      display: grid;
      place-items: center;
      letter-spacing: -0.02em;
      box-shadow: 0 4px 10px -4px rgba(114,47,142,0.5);
    }
    .yape-name { font-size: 13.5px; font-weight: 700; color: #5b2374; letter-spacing: 0.02em; }
    .yape-tag  { font-size: 11px; color: #888; font-weight: 500; display: flex; align-items: center; gap: 5px; }
    .yape-dot  { width: 6px; height: 6px; border-radius: 50%; background: #48bb78; display: inline-block; }

    /* QR */
    .qr-wrap {
      width: 200px; height: 200px;
      margin: 0 auto 16px;
      background: #fff;
      border: 2px dashed #c8d8d6;
      border-radius: 14px;
      display: grid;
      place-items: center;
      position: relative;
      box-shadow: inset 0 0 0 8px #fff, 0 8px 20px -10px rgba(58,143,139,0.30);
    }
    .qr-inner {
      width: 155px; height: 155px;
      background-image:
        linear-gradient(45deg,  #e0e0e0 25%, transparent 25%),
        linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
        linear-gradient(45deg,  transparent 75%, #e0e0e0 75%),
        linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
      background-size: 12px 12px;
      background-position: 0 0, 0 6px, 6px -6px, -6px 0;
      border-radius: 6px;
      position: relative;
      display: grid;
      place-items: center;
    }
    .qr-corner {
      position: absolute;
      width: 34px; height: 34px;
      background: #fff;
      border-radius: 4px;
      box-shadow: inset 0 0 0 3px #2c2c2c, inset 0 0 0 7px #fff, inset 0 0 0 11px #2c2c2c;
    }
    .qr-corner-tl { top: 4px;  left: 4px;  }
    .qr-corner-tr { top: 4px;  right: 4px; }
    .qr-corner-bl { bottom: 4px; left: 4px; }
    .qr-label-wrap { position: relative; z-index: 2; }
    .qr-label {
      background: #fff;
      padding: 2px 9px;
      border-radius: 999px;
      border: 1px solid #e0e0e0;
      font-size: 11px;
      font-weight: 700;
      color: #5b2374;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-family: 'Geist Mono', monospace;
    }

    /* Yape info grid */
    .yape-info {
      background: rgba(255,255,255,0.60);
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .yape-info-row { display: flex; flex-direction: column; gap: 3px; }
    .yi-k { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.06em; }
    .yi-v {
      font-size: 14px;
      font-weight: 600;
      color: #2c2c2c;
      font-family: 'Geist Mono', monospace;
      letter-spacing: 0.02em;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .yi-v.name { font-family: inherit; letter-spacing: -0.01em; }
    .copy-btn {
      width: 24px; height: 24px;
      display: grid;
      place-items: center;
      background: rgba(58,143,139,0.10);
      border: 1px solid rgba(58,143,139,0.30);
      color: #2e7874;
      border-radius: 6px;
      cursor: pointer;
    }
    .copy-btn:hover { background: rgba(58,143,139,0.18); }
    .yi-amount {
      background: linear-gradient(180deg, rgba(58,143,139,0.10), transparent);
      border: 1px solid rgba(58,143,139,0.30);
      border-radius: 10px;
      padding: 10px 14px;
      margin-top: 4px;
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .yi-amount-label { font-size: 11.5px; font-weight: 600; color: #2e7874; text-transform: uppercase; letter-spacing: 0.04em; }
    .yi-amount-val {
      font-family: 'Geist Mono', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #2e7874;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }
    .yi-amount-val .cur { font-size: 13px; font-weight: 600; opacity: .75; margin-right: 4px; vertical-align: 3px; }

    /* ── Upload ───────────────────────────────────────────── */
    .upload-zone {
      border: 2px dashed #c8d8d6;
      background: rgba(200,216,214,0.15);
      border-radius: 14px;
      padding: 26px 20px;
      text-align: center;
      transition: background .14s, border-color .14s;
      cursor: pointer;
    }
    .upload-zone:hover,
    .upload-zone-active {
      background: rgba(200,216,214,0.30);
      border-color: #3a8f8b;
    }
    .upload-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      margin: 0 auto 12px;
      background: rgba(58,143,139,0.12);
      color: #2e7874;
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 1px rgba(58,143,139,0.20);
    }
    .upload-title  { font-size: 14px; font-weight: 600; color: #2c2c2c; margin-bottom: 4px; }
    .upload-sub    { font-size: 12px; color: #666; margin-bottom: 14px; }
    .upload-formats{ font-size: 11px; color: #888; margin-top: 10px; font-family: 'Geist Mono', monospace; }
    .hidden-input  { display: none; }

    /* Uploaded row */
    .uploaded-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(72,187,120,0.10);
      border: 1px solid rgba(47,133,90,0.30);
      border-radius: 11px;
      padding: 11px 14px;
      margin-top: 14px;
    }
    .uploaded-thumb {
      width: 40px; height: 40px;
      border-radius: 8px;
      background: #fff;
      border: 1px solid rgba(47,133,90,0.25);
      display: grid;
      place-items: center;
      color: #2f855a;
      flex-shrink: 0;
    }
    .uploaded-meta  { flex: 1; min-width: 0; }
    .uploaded-name  {
      font-size: 13px;
      font-weight: 600;
      color: #2c2c2c;
      font-family: 'Geist Mono', monospace;
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .uploaded-name svg { color: #2f855a; flex-shrink: 0; }
    .uploaded-info {
      font-size: 11.5px;
      color: #666;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .uploaded-ok { color: #2f855a; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
    .remove-btn {
      width: 30px; height: 30px;
      display: grid;
      place-items: center;
      background: rgba(192,57,43,0.08);
      border: 1px solid #f5c6c6;
      color: #c0392b;
      border-radius: 8px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .remove-btn:hover { background: rgba(192,57,43,0.16); }

    /* ── Button ───────────────────────────────────────────── */
    .btn-primary {
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      padding: 13px 22px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid #2e7874;
      width: 100%;
      background: linear-gradient(180deg, #3a8f8b, #2e7874);
      color: #fff;
      box-shadow: 0 10px 22px -8px rgba(58,143,139,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset;
      transition: filter .14s, transform .08s;
    }
    .btn-primary:hover:not(:disabled)  { filter: brightness(1.06); }
    .btn-primary:active:not(:disabled) { transform: translateY(1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .send-foot {
      margin-top: 11px;
      text-align: center;
      font-size: 12px;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .send-foot svg { color: #2e7874; }

    /* ── Alerts ───────────────────────────────────────────── */
    .alert-error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff0f0;
      border: 1px solid #f5c6c6;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 13.5px;
      color: #c0392b;
    }
    .alert-success {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: rgba(72,187,120,0.10);
      border: 1px solid rgba(47,133,90,0.25);
      border-radius: 14px;
      padding: 20px 22px;
    }
    .alert-success-icon {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: rgba(72,187,120,0.15);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .alert-success-title { font-size: 16px; font-weight: 600; color: #2f855a; }
    .alert-success-sub   { font-size: 13px; color: #374151; margin-top: 4px; }
    .alert-success-hint  { font-size: 11.5px; color: #6b7280; margin-top: 4px; }

    /* ── Loading ──────────────────────────────────────────── */
    .loading-state { padding: 60px 0; text-align: center; }
    .spinner {
      display: inline-block;
      width: 40px; height: 40px;
      border-radius: 50%;
      border: 3px solid #e5e7eb;
      border-top-color: #3a8f8b;
      animation: spin 0.75s linear infinite;
    }
    .loading-text { margin-top: 12px; font-size: 13.5px; color: #6b7280; }

    /* ── Not pending ──────────────────────────────────────── */
    .not-pending-box {
      background: rgba(255,255,255,0.82);
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 48px 32px;
      text-align: center;
      box-shadow: 0 4px 16px -6px rgba(46,120,116,0.12);
    }
    .not-pending-title { font-size: 15px; font-weight: 600; color: #374151; margin-top: 12px; }
    .not-pending-sub   { font-size: 13.5px; color: #6b7280; margin-top: 4px; }

    /* ── Spin animation ───────────────────────────────────── */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin-icon { animation: spin 0.75s linear infinite; }

    /* ── Responsive ───────────────────────────────────────── */
    @media (max-width: 900px) {
      .pay-grid { grid-template-columns: 1fr; }
      .page-shell { padding: 16px 20px 40px; }
    }
  `]
})
export class ClientPaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(ClientOrdersService);
  private paymentsService = inject(ClientPaymentsService);

  orderId: string | null = null;
  order: ClientOrderDetail | null = null;

  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.error = 'No se proporcionó un ID de pedido.';
      this.isLoading = false;
    }
  }

  loadOrder(id: string): void {
    this.isLoading = true;
    this.ordersService.getOrderById(id).subscribe({
      next: (response) => {
        this.order = this.ordersService.unwrapResource(response);
        if (this.order?.status !== 'PENDING_PAYMENT') {
          this.error = 'Este pedido no está pendiente de pago.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el pedido.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  getAmountToPay(): number {
    if (!this.order) return 0;
    if (this.order.payment_condition === 'ADVANCE_50') {
      const advance = typeof this.order.advance_amount === 'number'
        ? this.order.advance_amount
        : Number(this.order.advance_amount ?? 0);
      return advance;
    }
    return this.ordersService.getOrderEstimatedPrice(this.order);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.error = 'Solo se permiten imágenes (jpg, png).';
        this.selectedFile = null;
        this.filePreview = null;
        return;
      }
      this.error = null;
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.filePreview = e.target?.result ?? null; };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.filePreview = null;
    this.error = null;
  }

  copyYapeNumber(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('999999999').catch(() => {});
    }
  }

  onSubmit(): void {
    if (!this.orderId || !this.selectedFile) return;

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    this.paymentsService.uploadPaymentCapture(this.orderId, this.selectedFile).subscribe({
      next: () => {
        this.success = 'Captura subida con éxito. Esperando validación del administrador.';
        this.isSubmitting = false;
        setTimeout(() => {
          this.router.navigate(['/client/orders', this.orderId]);
        }, 2500);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al subir la captura de pago.';
        this.isSubmitting = false;
        console.error(err);
      }
    });
  }
}
