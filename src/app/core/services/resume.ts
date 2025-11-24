import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private latestAnalysis: any = null;
  private latestMatchAnalysis: any = null;

  constructor(private http: HttpClient) {}

  /** 🧠 Utility: Build headers with Bearer token */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** 📤 Upload resume with Authorization header */
  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);

    const headers = this.getAuthHeaders();
    return this.http.post(`${environment.apiUrl}/resumes/upload`, formData, { headers });
  }

  matchResume(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${environment.apiUrl}/resumes/match`, formData, { headers });
  }

  /** 💾 Cache latest analysis in memory */
  setLatestAnalysis(data: any): void {
    this.latestAnalysis = data;
  }
  setLatestMatchAnalysis(data: any): void {
    this.latestMatchAnalysis = data;
  }

  getLatestAnalysis(): any {
    return this.latestAnalysis;
  }
  getLatestMatchAnalysis(): any {
    return this.latestMatchAnalysis;
  }

  clearLatestAnalysis(): void {
    this.latestAnalysis = null;
  }

  getResumeHistory(type: 'jd'| 'ats'): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${environment.apiUrl}/resumes/${type}`, { headers });
  }
}
