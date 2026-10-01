import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Auth } from './auth';

export const authGuard: CanActivateFn = (_route, state) => {
  if (typeof window === 'undefined') return true;

  const auth = inject(Auth);
  const router = inject(Router);
  const loginUrl = router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  if (!auth.isLoggedIn()) return loginUrl;

  return auth.validateSession().pipe(
    map(() => true),
    catchError(() => {
      auth.clearLocalSession();
      return of(loginUrl);
    }),
  );
};