import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class EnvironmentRuntimeService {
  private platformId = inject(PLATFORM_ID);

  /** SSR-safe browser check */
  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Get API URL depending on environment */
  getApiUrl(): string {
    if (!this.isBrowser()) {
      // SSR fallback (safe + consistent)
      return 'https://resuradar-api.onrender.com/api';
    }

    let href: string;
    try {
      href = window.location.href;
    } catch {
      return 'https://resuradar-api.onrender.com/api';
    }

    if (href.includes('localhost')) {
      return 'http://localhost:5000/api';
    }

    if (href.includes('render.com') || href.includes('prod')) {
      return 'https://resuradar-api.onrender.com/api';
    }

    return 'https://resuradar-api.onrender.com/api';
  }

  /** Determine if production */
  isProduction(): boolean {
    if (!this.isBrowser()) {
      return false; // SSR fallback
    }

    let href: string;
    try {
      href = window.location.href;
    } catch {
      return false;
    }

    return href.includes('prod') || href.includes('render.com');
  }
}
