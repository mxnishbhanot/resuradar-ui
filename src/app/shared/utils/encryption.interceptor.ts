import { HttpInterceptorFn, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { from, map, switchMap, of, catchError, throwError } from 'rxjs';
import { EncryptionService } from '../../core/services/encryption';
import { GoogleAuthService } from '../../core/services/google-auth';
import { isPlatformServer } from '@angular/common';

export const EncryptionInterceptor: HttpInterceptorFn = (req, next) => {
  const encSvc = inject(EncryptionService);

  const methodHasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
  const isFormData = req.body instanceof FormData;

  // Skip encryption for GET, DELETE, and multipart/form-data
  if (!methodHasBody || isFormData) {
    return next(req).pipe(
      switchMap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.body?.iv && event.body?.data) {
          return from(encSvc.decryptToObject(event.body)).pipe(
            map((plain) => event.clone({ body: plain }))
          );
        }
        return of(event);
      })
    );
  }

  // Encrypt JSON requests
  return from(encSvc.encryptObject(req.body)).pipe(
    switchMap((payload) => {
      const encryptedReq = req.clone({
        body: payload,
        headers: req.headers
          .set('X-Encrypted', '1')
          .set('Content-Type', 'application/json'),
      });

      return next(encryptedReq).pipe(
        switchMap((event: HttpEvent<any>) => {
          if (event instanceof HttpResponse && event.body?.iv && event.body?.data) {
            return from(encSvc.decryptToObject(event.body)).pipe(
              map((plain) => event.clone({ body: plain }))
            );
          }
          return of(event);
        })
      );
    })
  );
};


export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const auth = inject(GoogleAuthService);
  const encSvc = inject(EncryptionService);

  // -----------------------------------------
  // 1️⃣ BLOCK PROTECTED API CALLS DURING SSR
  // -----------------------------------------
  if (isPlatformServer(platformId)) {
    const protectedRoutes = [
      '/user/me',
      '/resumes',
      '/custom-resume'
    ];

    if (protectedRoutes.some(r => req.url.includes(r))) {
      // Prevent SSR errors & return harmless null response
      return of(null as any);
    }
  }

  // -----------------------------------------
  // 2️⃣ ATTACH TOKEN (BROWSER ONLY)
  // -----------------------------------------
  let token: string | null = null;
  if (!isPlatformServer(platformId)) {
    token = localStorage.getItem('auth_token');
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // -----------------------------------------
  // 3️⃣ HANDLE API CALL + DECRYPT ERRORS
  // -----------------------------------------

  return next(authReq).pipe(
    catchError(err => {
      console.log('Raw error from backend:', err);

      // If encrypted backend error
      if (err.error?.iv && err.error?.data) {
        return from(encSvc.decryptToObject(err.error)).pipe(
          switchMap((decryptedErrorBody: any) => {
            err = { ...err, error: decryptedErrorBody };

            if (err.status === 401 && err.error?.message === 'Invalid or expired token') {
              auth.logout();
            }

            return throwError(() => err);
          })
        );
      }

      // Normal JSON error
      if (err.status === 401 && err.error?.message === 'Invalid or expired token') {
        auth.logout();
      }

      return throwError(() => err);
    })
  );
};

