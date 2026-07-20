import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

// ── Response type ─────────────────────────────────────────────────────────────

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

// ── Cross-field validator: confirmPassword must match password ────────────────

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pwd  = group.get('password')?.value  ?? '';
    const pwd2 = group.get('confirmPassword')?.value ?? '';
    if (pwd2 === '') return null;
    return pwd === pwd2 ? null : { passwordMismatch: true };
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group(
    {
      firstName:       ['', [Validators.required, Validators.minLength(2)]],
      lastName:        ['', [Validators.required, Validators.minLength(2)]],
      dni:             ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      phone:           ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptedTerms:   [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator() }
  );

  isLoading           = signal(false);
  errorMessage        = signal('');
  successMessage      = signal('');
  showPassword        = signal(false);
  showConfirmPassword = signal(false);

  // ── Getters ───────────────────────────────────────────────────────────────

  get f() { return this.registerForm.controls; }

  /** Number of digits currently entered in the DNI field (0-8). */
  get dniCount(): number {
    return (this.f['dni'].value as string)?.length ?? 0;
  }

  /** Password strength score 0-4. */
  get passwordStrength(): number {
    const pwd: string = this.f['password'].value ?? '';
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  /** Human-readable label for the strength bar. */
  get strengthLabel(): string {
    const labels = ['', 'Debil', 'Regular', 'Fuerte', 'Muy fuerte'];
    return labels[this.passwordStrength] ?? '';
  }

  /** True when confirmPassword is filled and does NOT match password. */
  get passwordsMismatch(): boolean {
    const confirm: string = this.f['confirmPassword'].value ?? '';
    if (!confirm) return false;
    return this.registerForm.hasError('passwordMismatch');
  }

  /** True when confirmPassword is filled and both passwords match. */
  get passwordsMatch(): boolean {
    const confirm: string = this.f['confirmPassword'].value ?? '';
    if (!confirm) return false;
    return !this.registerForm.hasError('passwordMismatch');
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.registerForm.getRawValue();
    const payload = {
      first_name: formValue.firstName,
      last_name:  formValue.lastName,
      dni:        formValue.dni,
      phone:      formValue.phone,
      password:   formValue.password,
    };

    this.http
      .post<RegisterResponse>('/api/auth/register', payload)
      .subscribe({
        // Contrato del backend: { data: { id, dni, first_name, ... } } (201 Created).
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('¡Cuenta creada correctamente! Ya puedes iniciar sesion con tu DNI.');
          setTimeout(() => this.router.navigate(['/login']), 1800);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message ||
            'Ocurrio un error al registrarse. Verifique sus datos e intente nuevamente.'
          );
        },
      });
  }
}
