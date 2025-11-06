import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private client: any;
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  // 1️⃣ Initialize Google OAuth client + auto prompt setup
  initialize(clientId: string) {
    // Prevent re-initializing
    if (this.client) return;

    // Skip auto popup if already logged in
    const alreadyLoggedIn = !!localStorage.getItem('auth_token');
    if (alreadyLoggedIn) {
      console.log('User already logged in, skipping auto popup');
      return;
    }

    // Load One Tap / auto sign-in script
    const startGsi = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: true,
        callback: (response: any) => this.handleAutoSignIn(response),
        cancel_on_tap_outside: true,
      });

      // Prevent repeated popup spam: check a short-lived flag
      const lastPromptTime = localStorage.getItem('gsi_last_prompt');
      const shouldPrompt =
        !lastPromptTime ||
        Date.now() - Number(lastPromptTime) > 6 * 60 * 60 * 1000; // every 6h max

      if (shouldPrompt) {
        console.log('Showing Google One Tap prompt');
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('User dismissed One Tap or it was not shown');
          }
        });
        localStorage.setItem('gsi_last_prompt', Date.now().toString());
      } else {
        console.log('Skipping One Tap (recently shown)');
      }
    };

    // Load GSI script if not loaded
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

    // Initialize your existing OAuth token client (manual sign-in)
    this.client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: (response: any) => this.handleGoogleResponse(response),
    });
  }


  // 2️⃣ Manual sign-in (your existing working flow)
  signIn() {
    if (!this.client) {
      console.error('Google client not initialized.');
      this.initialize('159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com');
      return;
    }
    this.client.requestAccessToken();
  }

  // 3️⃣ Handle manual sign-in (existing logic)
  private handleGoogleResponse(response: any) {
    console.log('Google access token:', response.access_token);

    this.http
      .post<{ token: string; user: any }>(
        `${environment.apiUrl}/auth/google`,
        { token: response.access_token }
      )
      .pipe(
        tap((res) => {
          console.log('App JWT:', res.token);
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.setUser(res.user);
        })
      )
      .subscribe({
        next: () => console.log('User authenticated successfully!'),
        error: (err) => console.error('Auth failed:', err),
      });
  }

  // 4️⃣ Handle auto One Tap login callback
  private handleAutoSignIn(response: any) {
    if (!response?.credential) return;
    console.log('Auto sign-in credential received');

    this.http
      .post<{ token: string; user: any }>(
        `${environment.apiUrl}/auth/google`,
        { idToken: response.credential }
      )
      .pipe(
        tap((res) => {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.setUser(res.user);
        })
      )
      .subscribe({
        next: () => console.log('Auto sign-in successful'),
        error: (err) => console.error('Auto sign-in failed:', err),
      });
  }

  // 5️⃣ Helpers
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTab');
    this.userSubject.next(null);
    if (google?.accounts?.id) google.accounts.id.disableAutoSelect();
    this.router.navigate(['/'])
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  setUser(user: any) {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  loadUserFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.userSubject.next(JSON.parse(stored));
    }
  }
}
