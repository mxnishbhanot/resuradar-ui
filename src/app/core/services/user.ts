import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  user$ = this.userSubject.asObservable(); // public observable for components

  constructor(private http: HttpClient) { }

  /** Utility: build headers with auth token */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  /** Fetch current user from backend and update BehaviorSubject */
  fetchCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/user/me`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  /** Get latest value synchronously (optional helper) */
  get currentUser(): UserProfile | null {
    return this.userSubject.value;
  }

  /** Update user in subject manually after payment success */
  markUserAsPro() {
    const current = this.userSubject.value;
    if (current) {
      this.userSubject.next({ ...current, isPremium: true });
    }
  }

  /** Clear user state on logout */
  clearUser() {
    this.userSubject.next(null);
  }

  sendContact(payload: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/contact`, payload);
  }


}
