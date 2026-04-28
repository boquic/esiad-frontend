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
    identifier: ['', [Validators.required]], // Puede ser DNI o celular
    password: ['', [Validators.required]]
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

    const url = 'http://localhost:3000/api/auth/login';
    this.http.post<{ token: string }>(url, this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
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
        this.errorMessage = err.error?.message || 'Credenciales inválidas. Por favor verifique sus datos e intente nuevamente.';
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}
