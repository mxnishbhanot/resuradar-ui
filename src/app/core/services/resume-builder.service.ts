import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, of, timer, tap, debounce } from 'rxjs';

import {
  EMPTY_RESUME_STATE,
  ResumeBuilderState
} from '../../shared/models/resume-builder.model';
import { environment } from '../../../environments/environment';

import { Router, ActivatedRoute } from '@angular/router';

const STORAGE_KEY = 'rr_resume_builder_state_v1';

@Injectable({ providedIn: 'root' })
export class ResumeBuilderService {

  // --- Injected Services ---
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- Reactive Resume State (Signal) ---
  state = signal<ResumeBuilderState>(EMPTY_RESUME_STATE);

  // Track save status
  private autoSaveEnabled = true;
  private isDirty = false;

  constructor() {
    this.loadFromLocal();
    this.listenToUrlResumeId();
    this.setupAutoSave();
  }

  // --- Convenience getter ---
  get snapshot(): ResumeBuilderState {
    return this.state();
  }

  // -------------------------------
  // HEADER BUILDER
  // -------------------------------
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // -------------------------------
  // URL LISTENER (resumeId changes)
  // -------------------------------
  private listenToUrlResumeId() {
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('resumeId');
      const currentId = this.snapshot._id;

      if (id && id !== currentId) {
        this.loadSpecificResume(id);
      } else if (!id && currentId) {
        // No ID in URL, so clear state
        this.state.set(EMPTY_RESUME_STATE);
        this.saveToLocal();
      }
    });
  }

  // -------------------------------
  // LOAD RESUME FROM API
  // -------------------------------
  private loadSpecificResume(id: string) {
    this.getResume(id)
      .pipe(
        catchError(err => {
          console.error('Failed to load resume:', err);
          this.startNewResume();
          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (!res?.resume) return;

        this.state.set({
          _id: res.resume._id,
          personal: res.resume.personal || {},
          educations: res.resume.educations || [],
          experiences: res.resume.experiences || [],
          skills: res.resume.skills || [],
          projects: res.resume.projects || []
        });

        this.saveToLocal();
      });
  }

  loadDraftFromServer() {
    const id = this.route.snapshot.queryParamMap.get('resumeId');
    if (id) this.loadSpecificResume(id);
  }

  // -------------------------------
  // WRITE METHODS
  // -------------------------------
  update(partial: Partial<ResumeBuilderState>) {
    this.state.update(prev => ({ ...prev, ...partial }));
    this.isDirty = true;
    this.saveToLocal();
  }

  replace(newState: ResumeBuilderState) {
    this.state.set(newState);
    this.isDirty = true;
    this.saveToLocal();
  }

  startNewResume() {
    this.clearLocal();
    this.state.set(EMPTY_RESUME_STATE);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { resumeId: null },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.isDirty = true;
      this.autoSaveToServer();
    });
  }

  // -------------------------------
  // AUTO-SAVE (Signal-based!)
  // -------------------------------
  private setupAutoSave() {
    effect(() => {
      const current = this.state();

      // debounce changes by 2s
      debounce(() => timer(2000))(of(current)).subscribe(() => {
        if (this.isDirty && this.autoSaveEnabled) {
          this.autoSaveToServer();
        }
      });
    });
  }

  private autoSaveToServer() {
    const payload = {
      ...this.snapshot,
      _id: this.snapshot._id
    };

    this.http.put(`${environment.apiUrl}/custom-resume/draft/autosave`, payload, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(err => {
        console.error('Auto-save failed:', err);
        this.saveToLocal();
        return of(null);
      })
    )
    .subscribe((res: any) => {
      if (!res?.resume) return;

      this.isDirty = false;
      const newId = res.resume._id;

      // Update state with server _id
      if (!this.snapshot._id || this.snapshot._id !== newId) {
        this.state.update(prev => ({ ...prev, _id: newId }));
        this.saveToLocal();
      }

      // Update URL if necessary
      const currentId = this.route.snapshot.queryParamMap.get('resumeId');
      if (currentId !== newId) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { resumeId: newId },
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  // -------------------------------
  // MANUAL SAVE
  // -------------------------------
  saveResume(isDraft = false) {
    const state = this.snapshot;
    const url = `${environment.apiUrl}/custom-resume/${state._id || 'save'}`;
    const method = state._id ? 'PUT' : 'POST';

    return this.http.request(method, url, {
      body: { ...state, isDraft },
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.isDirty = false;
        this.saveToLocal();
      })
    );
  }

  completeResume() {
    const state = this.snapshot;
    return this.http.post(
      `${environment.apiUrl}/custom-resume/${state._id}/complete`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.isDirty = false;
        this.saveToLocal();
      })
    );
  }

  // -------------------------------
  // CRUD
  // -------------------------------
  getAllResumes() {
    return this.http.get(`${environment.apiUrl}/custom-resume/all`, {
      headers: this.getHeaders()
    });
  }

  getResume(id: string) {
    return this.http.get(`${environment.apiUrl}/custom-resume/${id}`, {
      headers: this.getHeaders()
    });
  }

  deleteResume(id: string) {
    return this.http.delete(`${environment.apiUrl}/custom-resume/${id}`, {
      headers: this.getHeaders()
    });
  }

  duplicateResume(id: string) {
    return this.http.post(`${environment.apiUrl}/custom-resume/${id}/duplicate`, {}, {
      headers: this.getHeaders()
    });
  }

  // -------------------------------
  // LOCAL STORAGE
  // -------------------------------
  saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch {}
  }

  loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      this.state.set({ ...EMPTY_RESUME_STATE, ...parsed });
    } catch {}
  }

  clearLocal() {
    localStorage.removeItem(STORAGE_KEY);
    this.state.set(EMPTY_RESUME_STATE);
  }

  // -------------------------------
  // AI Endpoints
  // -------------------------------
  generateWithAI(type: string, context: any) {
    return this.http.post(`${environment.apiUrl}/ai/generate`,
      { type, context },
      { headers: this.getHeaders() }
    );
  }

  generateSuggestions(type: string, context: any, count = 3) {
    return this.http.post(`${environment.apiUrl}/ai/suggestions`,
      { type, context, count },
      { headers: this.getHeaders() }
    );
  }

  improveContent(content: string, type?: string) {
    return this.http.post(`${environment.apiUrl}/ai/improve`,
      { content, type },
      { headers: this.getHeaders() }
    );
  }

  checkContent(content: string) {
    return this.http.post(`${environment.apiUrl}/ai/check`,
      { content },
      { headers: this.getHeaders() }
    );
  }

  exportPdf(template: string, resumeId: string) {
    const params = new HttpParams()
      .set('resumeId', resumeId)
      .set('template', template);

    return this.http.get(`${environment.apiUrl}/custom-resume/pdf`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob' as const
    });
  }

  // -------------------------------
  // Auto-save on/off
  // -------------------------------
  enableAutoSave() { this.autoSaveEnabled = true; }
  disableAutoSave() { this.autoSaveEnabled = false; }

}
