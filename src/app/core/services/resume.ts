import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { EnvironmentRuntimeService } from './environment.service';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  latestAnalysis = signal<any>(null);
  latestMatchAnalysis = signal<any>(null);

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('resume', file);

    return this.http.post(`${this.runtimeEnv.getApiUrl()}/resumes/upload`, formData);
  }

  matchResume(formData: FormData): Observable<any> {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/resumes/match`, formData);
  }

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

  getResumeHistory(type: 'jd' | 'ats'): Observable<any> {
    if (!this.isBrowser()) return of([]);
    return this.http.get(`${this.runtimeEnv.getApiUrl()}/resumes/${type}`);
  }
}
