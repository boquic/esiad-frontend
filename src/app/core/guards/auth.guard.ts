import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getRoleFromToken } from '../utils/jwt.utils';

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
    const role = getRoleFromToken(token);

    if (!role) {
      return true;
    }

    switch (role) {
      case 'ADMIN':
        return router.parseUrl('/admin/dashboard');
      case 'OPERATOR':
        return router.parseUrl('/operator/dashboard');
      case 'CLIENT':
      default:
        return router.parseUrl('/client/dashboard');
    }
  }

  return true;
};
