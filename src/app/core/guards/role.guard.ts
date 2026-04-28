import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!token) {
    return router.parseUrl('/login');
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;

    // Check if the route has restricted roles
    const expectedRoles = route.data?.['roles'] as Array<string>;

    if (expectedRoles && expectedRoles.length > 0 && !expectedRoles.includes(userRole)) {
      // User doesn't have the required role, redirect to their respective dashboard
      switch (userRole) {
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
  } catch (e) {
    // In case of error (e.g., malformed token), remove it and go to login
    localStorage.removeItem('token');
    return router.parseUrl('/login');
  }
};
