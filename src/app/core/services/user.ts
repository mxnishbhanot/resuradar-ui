import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  user = signal<UserProfile | null>(null);

  isLoggedIn = computed(() => !!this.user());

  isProUser = computed(() => !!this.user()?.isPremium);

  constructor() {}

  /** 🔐 Build Authorization Header */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  /** 👤 Fetch current user */
  fetchCurrentUser() {
    return this.http
      .get<UserProfile>(`${environment.apiUrl}/user/me`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(tap((user) => this.user.set(user)));
  }

  /** 🔄 Synchronous getter (optional utility) */
  get currentUser(): UserProfile | null {
    return this.user();
  }

  /** ⭐ Mark user as Pro after successful payment */
  markUserAsPro() {
    const current = this.user();
    if (current) {
      this.user.set({ ...current, isPremium: true });
    }
  }

  /** 🚪 Logout / clear user state */
  clearUser() {
    this.user.set(null);
  }

  /** ✉ Contact Support */
  sendContact(payload: any) {
    return this.http.post(`${environment.apiUrl}/contact`, payload);
  }
}
