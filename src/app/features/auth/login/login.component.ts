import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { getRoleFromToken } from '../../../core/utils/jwt.utils';

type LoginResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  access_token?: string;
  data?: {
    token?: string;
    accessToken?: string;
    jwt?: string;
    access_token?: string;
  };
  user?: {
    role?: string;
    roles?: string[];
  };
};

function extractToken(response: LoginResponse | string | null | undefined): string | null {
  if (!response) {
    return null;
  }

  if (typeof response === 'string') {
    try {
      return extractToken(JSON.parse(response) as LoginResponse);
    } catch {
      return null;
    }
  }

  const directToken = response.token ?? response.accessToken ?? response.jwt ?? response.access_token;
  if (typeof directToken === 'string' && directToken.trim()) {
    return directToken.trim();
  }

  const nestedToken = response.data?.token ?? response.data?.accessToken ?? response.data?.jwt ?? response.data?.access_token;
  if (typeof nestedToken === 'string' && nestedToken.trim()) {
    return nestedToken.trim();
  }

  return null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    identifier: ['', [Validators.required, Validators.pattern('^[0-9]{8,9}$')]], // Puede ser DNI (8) o celular (9)
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { identifier, password } = this.loginForm.getRawValue();
    const payload = {
      identifier: String(identifier ?? '').trim(),
      password: String(password ?? '')
    };

    console.info('[Auth/Login] Request payload', {
      identifier: payload.identifier,
      passwordLength: payload.password.length
    });

    const url = 'http://localhost:3000/api/auth/login';
    this.http.post<LoginResponse>(url, payload).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (res) => {
        console.info('[Auth/Login] Success response', {
          type: typeof res,
          keys: res && typeof res === 'object' ? Object.keys(res as Record<string, unknown>) : [],
          nestedKeys: res && typeof res === 'object' && (res as LoginResponse).data ? Object.keys((res as LoginResponse).data ?? {}) : []
        });

        const token = extractToken(res);
        console.info('[Auth/Login] Success response', {
          hasToken: !!token
        });

        if (!token) {
          this.errorMessage = 'La respuesta de login no incluyo un token valido.';
          return;
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
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
      },
      error: (err) => {
        console.error('[Auth/Login] Error response', {
          status: err?.status,
          message: err?.error?.message ?? err?.message,
          error: err?.error
        });
        this.errorMessage = err.error?.message || 'Credenciales inválidas. Por favor verifique sus datos e intente nuevamente.';
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}
