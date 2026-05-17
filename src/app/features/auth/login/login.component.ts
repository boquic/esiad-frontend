import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { getRoleFromToken } from '../../../core/utils/jwt.utils';

type LoginResponse = {
  data: {
    user: {
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
    identifier: ['', [Validators.required, Validators.pattern('^[0-9]{8,9}$')]], // Puede ser DNI (8) o celular (9)
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { identifier, password } = this.loginForm.getRawValue();
    const payload = {
      identifier: String(identifier ?? '').trim(),
      password: String(password ?? '')
    };

    console.info('[Auth/Login] Request payload', {
      identifier: payload.identifier,
      passwordLength: payload.password.length
    });

    const url = '/api/auth/login';
    this.http.post<LoginResponse>(url, payload).pipe(
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      next: (res) => {
        const token = res?.data?.token;
        const user = res?.data?.user;

        if (!token) {
          this.errorMessage.set('La respuesta de login no incluyo un token valido.');
          return;
        }

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
      },
      error: (err) => {
        console.error('[Auth/Login] Error response', {
          status: err?.status,
          message: err?.error?.message ?? err?.message,
          error: err?.error
        });
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas. Por favor verifique sus datos e intente nuevamente.');
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}
