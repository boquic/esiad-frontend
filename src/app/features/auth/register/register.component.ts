import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const url = 'http://localhost:3000/api/auth/register'; 
    this.http.post<{ message?: string }>(url, this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        // Navegar a la página de login luego del registro exitoso
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        // Mensaje del backend ante duplicado (409) o error validación (400)
        this.errorMessage = err.error?.message || 'Ocurrió un error al registrarse. Verifique sus datos o intente nuevamente.';
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }
}
