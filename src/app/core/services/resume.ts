import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EnvironmentRuntimeService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class ResumeService {

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  /** SSR-safe browser check */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Angular signals */
  latestAnalysis = signal<any>(null);
  latestMatchAnalysis = signal<any>(null);

  /** 🔐 SSR-safe Authorization Header */
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
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /** 📤 Upload resume (Browser-only FormData OK) */
  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);

    return this.http.post(
      `${this.runtimeEnv.getApiUrl()}/resumes/upload`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  /** 📊 Match resume with job description */
  matchResume(formData: FormData): Observable<any> {
    return this.http.post(
      `${this.runtimeEnv.getApiUrl()}/resumes/match`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  /** 🔄 Cache (SSR-Safe: signals run in Node without issue) */
  setLatestAnalysis(data: any): void {
    this.latestAnalysis.set(data);
  }

  setLatestMatchAnalysis(data: any): void {
    this.latestMatchAnalysis.set(data);
  }

  getLatestAnalysis() {
    return this.latestAnalysis();
  }

  getLatestMatchAnalysis() {
    return this.latestMatchAnalysis();
  }

  clearLatestAnalysis(): void {
    this.latestAnalysis.set(null);
  }

  /** 📚 Resume history fetch */
  getResumeHistory(type: 'jd' | 'ats'): Observable<any> {
    if (!this.isBrowser()) return of([]); // SSR-safe
    return this.http.get(
      `${this.runtimeEnv.getApiUrl()}/resumes/${type}`,
      { headers: this.getAuthHeaders() }
    );
  }

}
