import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { EnvironmentRuntimeService } from './environment.service';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  joinedDate?: any;
  resumeCount?: number;
  picture: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  /** SSR-safe browser check */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Signal store */
  user = signal<UserProfile | null>(null);

  isLoggedIn = computed(() => !!this.user());
  isProUser = computed(() => !!this.user()?.isPremium);

  constructor() { }

  /** 🔐 Build Authorization Header (SSR-Safe) */
  private getAuthHeaders(): HttpHeaders {
    let token: string | null = null;

    if (this.isBrowser()) {
      try {
        token = localStorage.getItem('auth_token');
      } catch {
        token = null;
      }
    }

    return token
      ? new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  /** 👤 Fetch current logged-in user */
  fetchCurrentUser(): Observable<UserProfile | null> {
    if (!this.isBrowser()) {
      return of(null);
    }

    return this.http
      .get<UserProfile>(`${this.runtimeEnv.getApiUrl()}/user/me`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap(user => {
          if (user) {
            this.user.set(user);
          } else {
            this.user.set(null);
          }
        }),
        catchError(() => {
          this.user.set(null); // clear on error
          return of(null);
        })
      );
  }


  /** 🔄 Synchronous signal read */
  get currentUser(): UserProfile | null {
    return this.user();
  }

  /** ⭐ Mark user as premium */
  markUserAsPro() {
    const current = this.user();
    if (current) {
      this.user.set({ ...current, isPremium: true });
    }
  }

  /** 🚪 Logout user (SSR-safe) */
  clearUser() {
    this.user.set(null);
  }

  /** ✉ Contact Support */
  sendContact(payload: any) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/contact`, payload, {
      headers: this.getAuthHeaders(),
    });
  }
}
