import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, of, throwError } from 'rxjs';
import { GoogleAuthService } from '../../core/services/google-auth';
import { isPlatformServer } from '@angular/common';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const auth = inject(GoogleAuthService);

  if (isPlatformServer(platformId)) {
    const protectedRoutes = ['/user/me', '/resumes', '/custom-resume'];
    if (protectedRoutes.some((route) => req.url.includes(route))) {
      return of(null as any);
    }
  }

  const authReq = req.clone({
    withCredentials: true,
  });

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401 && err.error?.message === 'Invalid or expired token') {
        auth.logout();
      }

      if (err.status === 401 && err.error?.message === 'Authentication required') {
        auth.clearSessionState();
      }

      return throwError(() => err);
    })
  );
};
