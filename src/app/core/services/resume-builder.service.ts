// services/resume-builder.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounce, tap, catchError } from 'rxjs/operators';
import {
  EMPTY_RESUME_STATE,
  ResumeBuilderState,
} from '../../shared/models/resume-builder.model';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

const STORAGE_KEY = 'rr_resume_builder_state_v1';

@Injectable({ providedIn: 'root' })
export class ResumeBuilderService {
  private stateSubject = new BehaviorSubject<ResumeBuilderState>(EMPTY_RESUME_STATE);
  state$ = this.stateSubject.asObservable();

  private autoSaveEnabled = true;
  private isDirty = false;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {
    this.loadFromLocal();
    this.setupAutoSave();
  }

  get snapshot(): ResumeBuilderState {
    return this.stateSubject.getValue();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }


  // Resume Management Methods
  loadDraftFromServer(): void {

    this.http.get(`${environment.apiUrl}/custom-resume/draft`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Failed to load draft:', error);
        return [];
      })
    ).subscribe((response: any) => {
      if (response?.resume) {
        const resume = response.resume;
        const state: ResumeBuilderState = {
          personal: resume.personal || {},
          educations: resume.educations || [],
          experiences: resume.experiences || [],
          skills: resume.skills || [],
          projects: resume.projects || []
        };
        this.stateSubject.next(state);
        this.saveToLocal(); // Also save locally as backup
      }
    });
  }

  update(partial: Partial<ResumeBuilderState>): void {
    const next = { ...this.snapshot, ...partial } as ResumeBuilderState;
    this.stateSubject.next(next);
    this.isDirty = true;
    this.saveToLocal();
  }

  replace(state: ResumeBuilderState): void {
    this.stateSubject.next(state);
    this.isDirty = true;
    this.saveToLocal();
  }

  // Auto-save setup with debouncing
  private setupAutoSave(): void {
    this.state$.pipe(
      debounce(() => timer(2000)) // Wait 2 seconds after last change
    ).subscribe(() => {
      if (this.isDirty && this.autoSaveEnabled) {
        this.autoSaveToServer();
      }
    });
  }

  private autoSaveToServer(): void {
    const state = this.snapshot;

    this.http.put(`${environment.apiUrl}/custom-resume/draft/autosave`, state, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Auto-save failed:', error);
        // Still save locally as fallback
        this.saveToLocal();
        return [];
      })
    ).subscribe((response: any) => {
      this.isDirty = false;
      // Only set param if it DOESN’T already exist
      const currentId = this.route.snapshot.queryParamMap.get('resumeId');

      if (!currentId) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { resumeId: response.resume._id },
          queryParamsHandling: 'merge'
        });
      }
      console.log('✅ Draft auto-saved at', response?.savedAt);
    });
  }

  // Manual save
  saveResume(isDraft: boolean = false): Observable<any> {
    const state = this.snapshot;

    return this.http.post(`${environment.apiUrl}/custom-resume/save`, {
      ...state,
      isDraft
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.isDirty = false;
        this.saveToLocal();
      })
    );
  }

  // Get all resumes
  getAllResumes(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/custom-resume/all`, {
      headers: this.getHeaders()
    });
  }

  // Get specific resume
  getResume(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/custom-resume/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Delete resume
  deleteResume(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/custom-resume/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Duplicate resume
  duplicateResume(id: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/custom-resume/${id}/duplicate`, {}, {
      headers: this.getHeaders()
    });
  }

  // Local storage methods (as backup)
  saveToLocal(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  loadFromLocal(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ResumeBuilderState;
        this.stateSubject.next({ ...EMPTY_RESUME_STATE, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }

  clearLocal(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
    this.stateSubject.next(EMPTY_RESUME_STATE);
  }

  // AI Generation Methods
  generateWithAI(type: string, context: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/ai/generate`, {
      type,
      context
    }, {
      headers: this.getHeaders()
    });
  }

  generateSuggestions(type: string, context: any, count: number = 3): Observable<any> {
    return this.http.post(`${environment.apiUrl}/ai/suggestions`, {
      type,
      context,
      count
    }, {
      headers: this.getHeaders()
    });
  }

  improveContent(content: string, type?: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/ai/improve`, {
      content,
      type
    }, {
      headers: this.getHeaders()
    });
  }

  checkContent(content: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/ai/check`, {
      content
    }, {
      headers: this.getHeaders()
    });
  }

  // Control auto-save
  enableAutoSave(): void {
    this.autoSaveEnabled = true;
  }

  disableAutoSave(): void {
    this.autoSaveEnabled = false;
  }


  exportPdf(template: string, resumeId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/custom-resume/pdf`, {
      headers: this.getHeaders(),
      params: {
        resumeId,
        template
      },
      responseType: 'blob' as 'json'
    });
  }

}
