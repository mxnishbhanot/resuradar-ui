import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private latestAnalysis: any = null;

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

  /** 💾 Cache latest analysis in memory */
  setLatestAnalysis(data: any): void {
    this.latestAnalysis = data;
  }

  getLatestAnalysis(): any {
    return this.latestAnalysis;
  }

  clearLatestAnalysis(): void {
    this.latestAnalysis = null;
  }

  getResumeHistory(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${environment.apiUrl}/resumes`, { headers });
  }
}
