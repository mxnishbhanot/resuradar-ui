import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { NoPreloading, provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { iloadersInterceptor } from 'sc-angular-loader';
import { AuthInterceptor, EncryptionInterceptor } from './shared/utils/encryption.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(NoPreloading)),
    provideHttpClient(withFetch(), withInterceptors([iloadersInterceptor, EncryptionInterceptor, AuthInterceptor]))
  ]
};
