import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { authUser } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
    const user = authUser();
  const returnUrl = state?.url || '/';
  // Simple presence check: if token exists allow navigation, otherwise redirect to login.
    if (user) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
