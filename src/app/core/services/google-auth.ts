import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SkeletonService } from './skeleton';
import { EnvironmentRuntimeService } from './environment.service';
import { firstValueFrom } from 'rxjs';

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

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  user = signal<any | null>(null);
  isLoggedIn = computed(() => !!this.user());
  isUserLoaded = computed(() => !!this.user());

  private client: any = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (this.isBrowser()) {
      this.loadUserFromStorage();
    }
  }

  initialize(clientId: string): Promise<void> {
    if (!this.isBrowser()) return Promise.resolve();
    if (this.client && window.google?.accounts) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    if (this.user()) return Promise.resolve();

    this.initPromise = new Promise<void>((resolve, reject) => {
      const startGsi = () => {
        try {
          if (!window.google?.accounts) {
            return reject(new Error('google.accounts not available after script load'));
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            auto_select: true,
            callback: (response: any) => this.handleAutoSignIn(response),
            cancel_on_tap_outside: true,
          });

          try {
            const lastPromptTime = localStorage.getItem('gsi_last_prompt');
            const shouldPrompt =
              !lastPromptTime || Date.now() - Number(lastPromptTime) > 6 * 60 * 60 * 1000;
            if (shouldPrompt) {
              window.google.accounts.id.prompt();
              localStorage.setItem('gsi_last_prompt', Date.now().toString());
            }
          } catch {}

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

      if (window.google) {
        if (window.google.accounts) {
          startGsi();
        } else {
          const timer = setInterval(() => {
            if (window.google?.accounts) {
              clearInterval(timer);
              startGsi();
            }
          }, 50);

          setTimeout(() => {
            clearInterval(timer);
            if (!window.google?.accounts) {
              reject(new Error('google.accounts not available after timeout'));
            }
          }, 5000);
        }
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => startGsi();
        script.onerror = () => reject(new Error('Failed to load GSI script'));
        document.head.appendChild(script);
      } catch (err) {
        reject(err);
      }
    }).finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  async signIn(): Promise<void> {
    if (!this.isBrowser()) return;

    try {
      await this.initialize('159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com');
    } catch (err) {
      console.error('[GoogleAuth] initialize failed', err);
      return;
    }

    if (!this.client) {
      console.error('Google client not initialized - unable to sign in');
      return;
    }

    try {
      this.client.requestAccessToken();
    } catch (err) {
      console.error('requestAccessToken failed', err);
    }
  }

  async bootstrapSession(): Promise<void> {
    if (!this.isBrowser()) return;

    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.runtimeEnv.getApiUrl()}/user/me`, { withCredentials: true })
      );
      if (res) {
        this.setUser(res);
      }
    } catch {
      this.clearSessionState();
    }
  }

  private handleManualSignIn(response: any) {
    this.skeleton.setLoading(true);

    this.http
      .post<{ user: any }>(
        `${this.runtimeEnv.getApiUrl()}/auth/google`,
        { token: response.access_token },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => this.storeAuthData(res)),
        finalize(() => this.skeleton.setLoading(false))
      )
      .subscribe({
        next: () => {},
        error: (err) => console.error('Manual sign-in failed', err),
      });
  }

  private handleAutoSignIn(response: any): void {
    if (!this.isBrowser() || !response?.credential) return;

    this.http
      .post<{ user: any }>(
        `${this.runtimeEnv.getApiUrl()}/auth/google`,
        { idToken: response.credential },
        { withCredentials: true }
      )
      .pipe(tap((res) => this.storeAuthData(res)))
      .subscribe({
        next: () => {},
        error: (err) => console.error('One Tap Login Failed:', err),
      });
  }

  private storeAuthData(res: { user: any }) {
    if (this.isBrowser()) {
      try {
        localStorage.setItem('user', JSON.stringify(res.user));
      } catch {}
    }
    this.user.set(res.user);
  }

  setUser(user: any) {
    if (this.isBrowser()) {
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch {}
    }
    this.user.set(user);
  }

  loadUserFromStorage() {
    if (!this.isBrowser()) return;
    try {
      const stored = localStorage.getItem('user');
      if (stored) this.user.set(JSON.parse(stored));
    } catch {}
  }

  clearSessionState() {
    if (this.isBrowser()) {
      try {
        localStorage.removeItem('user');
      } catch {}
    }
    this.user.set(null);
  }

  logout() {
    this.http
      .post(`${this.runtimeEnv.getApiUrl()}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ next: () => {}, error: () => {} });

    if (this.isBrowser()) {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('activeTab');
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
        }
      } catch {}
    }

    this.user.set(null);

    try {
      this.router.navigate(['/']);
    } catch {}
  }
}
