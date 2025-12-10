import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SkeletonService } from './skeleton';
import { EnvironmentRuntimeService } from './environment.service';

declare global {
  interface Window {
    google?: any;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private skeleton = inject(SkeletonService);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  /** Browser detection */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Signals */
  user = signal<any | null>(null);

  isLoggedIn = computed(() =>
    this.isBrowser() ? !!localStorage.getItem('auth_token') : false
  );

  isUserLoaded = computed(() => !!this.user());

  private client: any = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Only read from localStorage in browser
    if (this.isBrowser()) {
      this.loadUserFromStorage();
    }
  }

  // ----------------------------------------------------------
  // 1️⃣ Initialize Google OAuth + One Tap (returns a Promise)
  // ----------------------------------------------------------
  initialize(clientId: string): Promise<void> {
    if (!this.isBrowser()) {
      // SSR: resolve immediately (no-op)
      return Promise.resolve();
    }

    // If already initialized, return resolved promise
    if (this.client && window.google?.accounts) {
      return Promise.resolve();
    }

    // If an initialization is already in progress, return same promise
    if (this.initPromise) return this.initPromise;

    // If user already logged in, skip One Tap init
    try {
      const alreadyLoggedIn = !!localStorage.getItem('auth_token');
      if (alreadyLoggedIn) {
        return Promise.resolve();
      }
    } catch {
      // ignore storage errors
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      const startGsi = () => {
        try {
          if (!window.google?.accounts) {
            return reject(new Error('google.accounts not available after script load'));
          }

          // One Tap initialization
          window.google.accounts.id.initialize({
            client_id: clientId,
            auto_select: true,
            callback: (response: any) => this.handleAutoSignIn(response),
            cancel_on_tap_outside: true,
          });

          // Prompt logic (rate limit)
          try {
            const lastPromptTime = localStorage.getItem('gsi_last_prompt');
            const shouldPrompt =
              !lastPromptTime ||
              Date.now() - Number(lastPromptTime) > 6 * 60 * 60 * 1000;

            if (shouldPrompt) {
              window.google.accounts.id.prompt();
              localStorage.setItem('gsi_last_prompt', Date.now().toString());
            }
          } catch {
            // ignore localStorage errors
          }

          // Init manual OAuth client
          this.client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: (response: any) => this.handleManualSignIn(response),
          });

          resolve();
        } catch (err) {
          reject(err);
        }
      };

      // If script already present
      if (window.google) {
        if (window.google.accounts) {
          startGsi();
        } else {
          // Wait briefly for google to be ready
          const t = setInterval(() => {
            if (window.google?.accounts) {
              clearInterval(t);
              startGsi();
            }
          }, 50);

          setTimeout(() => {
            clearInterval(t);
            if (!window.google?.accounts) {
              reject(new Error('google.accounts not available after timeout'));
            }
          }, 5000);
        }
        return;
      }

      // Load GSI script in browser
      try {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => startGsi();
        script.onerror = (ev) => reject(new Error('Failed to load GSI script'));

        document.head.appendChild(script);
      } catch (err) {
        reject(err);
      }
    })
      .finally(() => {
        // clear initPromise so subsequent calls can retry if needed
        this.initPromise = null;
      });

    return this.initPromise;
  }

  // ----------------------------------------------------------
  // 2️⃣ Manual Sign-In Flow
  // ----------------------------------------------------------
  async signIn(): Promise<void> {
    if (!this.isBrowser()) return; // SSR: no-op

    // Ensure initialization; wait up to initialize to finish
    try {
      await this.initialize(
        '159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com'
      );
    } catch (err) {
      console.error('[GoogleAuth] initialize failed', err);
      // initialization failed — avoid calling client
      return;
    }

    if (!this.client) {
      console.error('Google client not initialized — unable to sign in');
      return;
    }

    // Request access token (manual OAuth)
    try {
      this.client.requestAccessToken();
    } catch (err) {
      console.error('requestAccessToken failed', err);
    }
  }

  private handleManualSignIn(response: any) {
    this.skeleton.setLoading(true);

    this.http
      .post<{ token: string; user: any }>(
        `${this.runtimeEnv.getApiUrl()}/auth/google`,
        { token: response.access_token }
      )
      .pipe(
        tap((res) => this.storeAuthData(res)),
        finalize(() => this.skeleton.setLoading(false))
      )
      .subscribe({
        next: () => {},
        error: (err) => {
          console.error('Manual sign-in failed', err);
        }
      });
  }

  // ----------------------------------------------------------
  // 3️⃣ One Tap Login Flow
  // ----------------------------------------------------------
  private handleAutoSignIn(response: any): void {
    if (!this.isBrowser()) return; // SSR safe

    if (!response?.credential) return;

    this.http
      .post<{ token: string; user: any }>(
        `${this.runtimeEnv.getApiUrl()}/auth/google`,
        { idToken: response.credential }
      )
      .pipe(tap((res) => this.storeAuthData(res)))
      .subscribe({
        next: () => {},
        error: (err) => {
          console.error('One Tap Login Failed:', err);
        }
      });
  }

  // ----------------------------------------------------------
  // 4️⃣ User + Token Helpers
  // ----------------------------------------------------------
  private storeAuthData(res: { token: string; user: any }) {
    if (this.isBrowser()) {
      try {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      } catch {
        // ignore storage errors
      }
    }
    this.user.set(res.user);
  }

  setUser(user: any) {
    if (this.isBrowser()) {
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch {
        /* noop */
      }
    }
    this.user.set(user);
  }

  loadUserFromStorage() {
    if (!this.isBrowser()) return;
    try {
      const stored = localStorage.getItem('user');
      if (stored) this.user.set(JSON.parse(stored));
    } catch {
      /* noop */
    }
  }

  // ----------------------------------------------------------
  // 5️⃣ Logout
  // ----------------------------------------------------------
  logout() {
    if (this.isBrowser()) {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeTab');

        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
        }
      } catch {
        /* noop */
      }
    }

    this.user.set(null);

    try {
      this.router.navigate(['/']);
    } catch {
      /* noop */
    }
  }
}
