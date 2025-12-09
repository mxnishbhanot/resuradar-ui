import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResumeService {

  private http = inject(HttpClient);

  /** Store latest analyses using Angular signals */
  latestAnalysis = signal<any>(null);
  latestMatchAnalysis = signal<any>(null);

  /** 🔐 Build Authorization header */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /** 📤 Upload resume */
  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);

    return this.http.post(
      `${environment.apiUrl}/resumes/upload`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  /** 📊 Match resume with job description */
  matchResume(formData: FormData): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/resumes/match`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  /** 💾 Signal-based caching */
  setLatestAnalysis(data: any): void {
    this.latestAnalysis.set(data);
  }

  setLatestMatchAnalysis(data: any): void {
    this.latestMatchAnalysis.set(data);
  }

  /** 🚀 Signal-based getters (template-friendly) */
  getLatestAnalysis() {
    return this.latestAnalysis();
  }

  getLatestMatchAnalysis() {
    return this.latestMatchAnalysis();
  }

  clearLatestAnalysis(): void {
    this.latestAnalysis.set(null);
  }

  /** 📚 Resume history */
  getResumeHistory(type: 'jd' | 'ats'): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/resumes/${type}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
