import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

type RegisterResponse = {
  data: {
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
};

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

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Transform form data to match API contract (camelCase → snake_case)
    const formValue = this.registerForm.getRawValue();
    const payload = {
      first_name: formValue.firstName,
      last_name: formValue.lastName,
      dni: formValue.dni,
      phone: formValue.phone,
      password: formValue.password
    };

    const url = '/api/auth/register'; 
    this.http.post<RegisterResponse>(url, payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Navegar a la página de login luego del registro exitoso
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Mensaje del backend ante duplicado (409) o error validación (400)
        this.errorMessage.set(err.error?.message || 'Ocurrió un error al registrarse. Verifique sus datos o intente nuevamente.');
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }
}
