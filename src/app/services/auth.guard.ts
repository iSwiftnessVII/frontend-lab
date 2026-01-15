import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { authUser, authService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const returnUrl = state?.url || '/';

  // Combinar ambas estrategias: usar checkAuth() pero mantener compatibilidad
  const user = await authService.checkAuth();
  
  if (user) {
    return true;
  }

  // Si checkAuth falla, intentar con whoami() para compatibilidad
  const token = authService.getToken();
  if (!token) return router.createUrlTree(['/login'], { queryParams: { returnUrl } });

  try {
    await authService.whoami();
    return true;
  } catch (err) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }
};

// Evita mostrar login si ya hay sesión válida
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);

  // Fast-path: si ya tenemos usuario en memoria
  if (authUser()) {
    return router.createUrlTree(['/dashboard']);
  }

  // Si hay token, intentar validar sesión
  const token = authService.getToken();
  if (!token) return true;

  try {
    const user = await authService.checkAuth();
    return user ? router.createUrlTree(['/dashboard']) : true;
  } catch {
    return true;
  }
};

export const roleGuard: CanActivateFn = async (route) => {
  const router = inject(Router);

  // Esperar hasta que el usuario esté disponible (máximo 500ms)
  let user = authUser();
  let attempts = 0;
  
  while (!user && attempts < 5) {
    await new Promise(resolve => setTimeout(resolve, 100));
    user = authUser();
    attempts++;
  }

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as string[];
  
  if (!allowedRoles) {
    return true;
  }

  if (!authService.hasRole(allowedRoles)) {
  if (user.rol === 'Superadmin') {
    return true; // ✅ Superadmin puede acceder a todo
  } else {
    return router.createUrlTree(['/dashboard']);
  }
}

  // if (!authService.hasRole(allowedRoles)) {
  //   if (user.rol === 'Superadmin') {
  //     return router.createUrlTree(['/usuarios']);
  //   } else {
  //     return router.createUrlTree(['/dashboard']);
  //   }
  // }

  return true;
};