import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { EnvironmentRuntimeService } from './environment.service';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  /** Effective premium access (active subscription or legacy lifetime). */
  isPremium: boolean;
  hasActivePremium?: boolean;
  joinedDate?: any;
  resumeCount?: number;
  picture: string;
  standardUsed?: number;
  standardLimit?: number;
  jdUsed?: number;
  jdLimit?: number;
  premiumUntil?: string | null;
  subscriptionStatus?: string;
  freeBuilderTemplates?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  user = signal<UserProfile | null>(null);
  isLoggedIn = computed(() => !!this.user());
  isProUser = computed(() => this.user()?.isPremium === true);

  fetchCurrentUser(): Observable<UserProfile | null> {
    if (!this.isBrowser()) {
      return of(null);
    }

    return this.http.get<UserProfile>(`${this.runtimeEnv.getApiUrl()}/user/me`).pipe(
      tap((u) => this.user.set(u || null)),
      catchError(() => {
        this.user.set(null);
        return of(null);
      })
    );
  }

  get currentUser(): UserProfile | null {
    return this.user();
  }

  markUserAsPro() {
    const current = this.user();
    if (current) {
      this.user.set({ ...current, isPremium: true, hasActivePremium: true });
    }
  }

  clearUser() {
    this.user.set(null);
  }

  sendContact(payload: any) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/contact`, payload);
  }
}
