import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { catchError, map, of, from, switchMap } from 'rxjs';

export const onboardingGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to load first, then check plan
  return from(auth.loadCurrentUser()).pipe(
    switchMap(() => {
      const userId = auth.currentUser()?.userId;
      if (!userId) return of(true); // not logged in, let authGuard handle
      return api.getPlan().pipe(
        map(() => true),
        catchError((err) => {
          if (err.status === 404) {
            return of(router.createUrlTree(['/onboarding']));
          }
          return of(true);
        })
      );
    })
  );
};