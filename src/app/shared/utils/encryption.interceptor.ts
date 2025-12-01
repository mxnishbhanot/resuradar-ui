import { HttpInterceptorFn, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, map, switchMap, of, catchError, throwError } from 'rxjs';
import { EncryptionService } from '../../core/services/encryption';
import { GoogleAuthService } from '../../core/services/google-auth';
import { Router } from '@angular/router';

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
  const auth = inject(GoogleAuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 && err.error?.message === 'Invalid or expired token') {
        auth.logout();
        router.navigate(['/login'], { queryParams: { sessionExpired: true } });
      }

      return throwError(() => err);
    })
  );
};
