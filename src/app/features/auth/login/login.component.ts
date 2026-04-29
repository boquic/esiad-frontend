import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

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
    this.http.post<{ token: string }>(url, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.info('[Auth/Login] Success response', {
          hasToken: !!res?.token
        });
        if (res.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', res.token);
          }
          
          try {
            const payload = JSON.parse(atob(res.token.split('.')[1]));
            const role = payload.role;

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
          } catch (err) {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
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
