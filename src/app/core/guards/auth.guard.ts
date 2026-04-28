import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    return router.parseUrl('/login');
  }

  return true;
};

export const publicGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      switch (role) {
        case 'ADMIN':
          return router.parseUrl('/admin/dashboard');
        case 'OPERATOR':
          return router.parseUrl('/operator/dashboard');
        case 'CLIENT':
        default:
          return router.parseUrl('/client/dashboard');
      }
    } catch (e) {
      // Invalid token, allow access to public routes
      return true;
    }
  }

  return true;
};
