import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';
import { BehaviorSubject } from 'rxjs';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private client: any;
   private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 1️⃣ Initialize Google OAuth client
  initialize(clientId: string) {
    this.client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: (response: any) => this.handleGoogleResponse(response),
    });
  }

  // 2️⃣ Trigger Google sign-in popup
  signIn() {
    if (!this.client) {
      console.error('Google client not initialized.');
      return;
    }
    this.client.requestAccessToken();
  }

  // 3️⃣ Handle Google token response
  private handleGoogleResponse(response: any) {
    console.log('Google access token:', response.access_token);

    // Send the Google token to your backend for verification
    this.http
      .post<{ token: string; user: any }>(
        `${environment.apiUrl}/auth/google`,
        { token: response.access_token }
      )
      .pipe(
        tap((res) => {
          console.log('App JWT:', res.token);
          // Save JWT & user in local storage
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

  // 4️⃣ Helper functions
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
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
