import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If already resolved, use cached value
  if (!auth.isLoading()) {
    if (auth.isAuthenticated()) return true;
    return router.createUrlTree(['/login']);
  }

  // Otherwise wait for checkAuth to complete
  return auth.checkAuth().pipe(
    map(user => {
      if (user) return true;
      return router.createUrlTree(['/login']);
    })
  );
};

