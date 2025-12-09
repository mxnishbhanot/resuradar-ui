import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SkeletonService } from './skeleton';
import { environment } from '../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private skeleton = inject(SkeletonService);

  /** 🔥 Angular Signals replace BehaviorSubject */
  user = signal<any | null>(null);

  /** Derived signals */
  isLoggedIn = computed(() => !!localStorage.getItem('auth_token'));
  isUserLoaded = computed(() => !!this.user());

  private client: any = null;

  constructor() {
    this.loadUserFromStorage();
  }

  // ----------------------------------------------------------
  // 1️⃣ Initialize Google OAuth + One Tap
  // ----------------------------------------------------------
  initialize(clientId: string): void {
    if (this.client) return; // Prevent re-init

    const alreadyLoggedIn = !!localStorage.getItem('auth_token');
    if (alreadyLoggedIn) return;

    const startGsi = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: true,
        callback: (response: any) => this.handleAutoSignIn(response),
        cancel_on_tap_outside: true,
      });

      const lastPromptTime = localStorage.getItem('gsi_last_prompt');
      const shouldPrompt =
        !lastPromptTime ||
        Date.now() - Number(lastPromptTime) > 6 * 60 * 60 * 1000;

      if (shouldPrompt) {
        google.accounts.id.prompt();
        localStorage.setItem('gsi_last_prompt', Date.now().toString());
      }

      // Init manual OAuth client
      this.client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: (response: any) => this.handleManualSignIn(response),
      });
    };

    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = startGsi;
      document.head.appendChild(script);
    } else {
      startGsi();
    }
  }

  // ----------------------------------------------------------
  // 2️⃣ Manual Sign-In Flow
  // ----------------------------------------------------------
  signIn() {
    if (!this.client) {
      console.error('Google client not initialized — initializing now...');
      this.initialize(
        '159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com'
      );
      return;
    }
    this.client.requestAccessToken();
  }

  // Manual sign-in callback
  private handleManualSignIn(response: any) {
    this.skeleton.setLoading(true);

    this.http
      .post<{ token: string; user: any }>(
        `${environment.apiUrl}/auth/google`,
        { token: response.access_token }
      )
      .pipe(
        tap((res) => this.storeAuthData(res)),
        finalize(() => this.skeleton.setLoading(false))
      )
      .subscribe({
        next: () => console.log('Manual sign-in success'),
        error: (err) => console.error('Manual sign-in failed', err),
      });
  }

  // ----------------------------------------------------------
  // 3️⃣ One Tap Login Flow
  // ----------------------------------------------------------
  private handleAutoSignIn(response: any): void {
    if (!response?.credential) return;

    this.http
      .post<{ token: string; user: any }>(
        `${environment.apiUrl}/auth/google`,
        { idToken: response.credential }
      )
      .pipe(tap((res) => this.storeAuthData(res)))
      .subscribe({
        next: () => console.log('One Tap Login Success'),
        error: (err) => console.error('One Tap Login Failed:', err),
      });
  }

  // ----------------------------------------------------------
  // 4️⃣ User + Token Helpers
  // ----------------------------------------------------------
  private storeAuthData(res: { token: string; user: any }) {
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.user.set(res.user);
  }

  setUser(user: any) {
    this.user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  loadUserFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) this.user.set(JSON.parse(stored));
  }

  // ----------------------------------------------------------
  // 5️⃣ Logout
  // ----------------------------------------------------------
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTab');

    this.user.set(null);

    if (google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }

    this.router.navigate(['/']);
  }
}
