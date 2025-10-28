import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { authUser, authService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const user = authUser();
  const returnUrl = state?.url || '/';

  if (user) return true;

  const token = authService.getToken();
  if (!token) return router.createUrlTree(['/login'], { queryParams: { returnUrl } });

  // Try to restore user using the token
  try {
    await authService.whoami();
    return true;
  } catch (err) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
};
