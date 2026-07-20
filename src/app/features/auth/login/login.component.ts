import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import QRCode from 'qrcode';
import { getRoleFromToken } from '../../../core/utils/jwt.utils';

type AuthUser = {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  completed_orders_count: number;
  is_frequent: boolean;
  created_at: string;
};

// El login (paso 1) puede devolver: token directo (legacy), reto de enrolamiento
// 2FA (con QR) o reto de verificación 2FA (ya enrolado).
type LoginStep1 = {
  data: Partial<{
    token: string;
    user: AuthUser;
    requires_2fa_setup: boolean;
    requires_2fa: boolean;
    otpauth_url: string;
    secret: string;
  }>;
};

type VerifyResponse = {
  data: {
    user: AuthUser;
    token: string;
  };
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    identifier: ['', [Validators.required, Validators.pattern('^[0-9]{8,9}$')]], // DNI (8) o celular (9)
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  codeForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  // Flujo 2FA
  step = signal<'credentials' | 'twofa'>('credentials');
  twoFaMode = signal<'setup' | 'verify'>('verify'); // 'setup' muestra el QR
  qrDataUrl = signal<string>('');
  secret = signal<string>('');

  // Credenciales validadas en el paso 1 (en memoria, para el paso 2).
  private pending: { identifier: string; password: string } | null = null;

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { identifier, password } = this.loginForm.getRawValue();
    const creds = {
      identifier: String(identifier ?? '').trim(),
      password: String(password ?? '')
    };

    this.http.post<LoginStep1>('/api/auth/login', creds).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        const data = res?.data ?? {};

        // HU-19/RULE-01: el rol CLIENT omite el 2FA por completo; el backend
        // devuelve el token directamente en el paso 1 (sin requires_2fa_setup
        // ni requires_2fa), así que aquí saltamos la pantalla de código/QR y
        // entramos de una vez. OPERATOR y ADMIN no entran por esta rama: para
        // ellos el backend sigue devolviendo el reto 2FA (setup o verify).
        if (data.token) {
          this.handleAuthSuccess(data.token, data.user);
          return;
        }

        this.pending = creds;

        if (data.requires_2fa_setup) {
          this.twoFaMode.set('setup');
          this.secret.set(data.secret ?? '');
          if (data.otpauth_url) {
            QRCode.toDataURL(data.otpauth_url)
              .then((url) => this.qrDataUrl.set(url))
              .catch(() => this.qrDataUrl.set(''));
          }
          this.step.set('twofa');
        } else if (data.requires_2fa) {
          this.twoFaMode.set('verify');
          this.step.set('twofa');
        } else {
          this.errorMessage.set('Respuesta de login inesperada del servidor.');
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas. Verifique sus datos e intente nuevamente.');
      }
    });
  }

  verifyCode() {
    if (this.codeForm.invalid || !this.pending) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = {
      ...this.pending,
      code: String(this.codeForm.getRawValue().code ?? '').trim()
    };

    this.http.post<VerifyResponse>('/api/auth/login/verify', payload).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        const token = res?.data?.token;
        if (!token) {
          this.errorMessage.set('La verificación no devolvió un token válido.');
          return;
        }
        this.handleAuthSuccess(token, res.data.user);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Código inválido. Intente nuevamente.');
      }
    });
  }

  backToCredentials() {
    this.step.set('credentials');
    this.errorMessage.set('');
    this.codeForm.reset();
    this.qrDataUrl.set('');
    this.pending = null;
  }

  private handleAuthSuccess(token: string, user?: AuthUser) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      if (user?.first_name && user?.last_name) {
        localStorage.setItem('userName', `${user.first_name} ${user.last_name}`);
      }
    }

    const role = getRoleFromToken(token);
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'OPERATOR':
        this.router.navigate(['/operator/dashboard']);
        break;
      case 'CLIENT':
      default:
        this.router.navigate(['/client/dashboard']);
        break;
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  get c() {
    return this.codeForm.controls;
  }
}
