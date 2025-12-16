import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<any | null>(null);

  isLoggedIn = computed(() => !!this.user());

  private client: any;

  initialize(clientId: string) {
    if (this.client || localStorage.getItem('auth_token')) return;

    const start = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: true,
        callback: (res: any) => this.handleOneTap(res)
      });

      google.accounts.id.prompt();

      this.client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: (res: any) => this.handleManual(res)
      });
    };

    if (!(window as any).google) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = start;
      document.head.appendChild(s);
    } else {
      start();
    }
  }

  signIn() {
    this.client?.requestAccessToken();
  }

  private handleManual(res: any) {
    this.http.post<any>(`${environment.apiUrl}/auth/google`, {
      token: res.access_token
    }).subscribe(r => this.storeAuth(r));
  }

  private handleOneTap(res: any) {
    if (!res?.credential) return;

    this.http.post<any>(`${environment.apiUrl}/auth/google`, {
      idToken: res.credential
    }).subscribe(r => this.storeAuth(r));
  }

  private storeAuth(res: { token: string; user: any }) {
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.user.set(res.user);
  }

  loadUserFromStorage() {
    const u = localStorage.getItem('user');
    if (u) this.user.set(JSON.parse(u));
  }

  logout() {
    localStorage.clear();
    this.user.set(null);
    google?.accounts?.id?.disableAutoSelect();
    this.router.navigate(['/']);
  }
}
