import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, of, timer, tap, debounce } from 'rxjs';

import {
  EMPTY_RESUME_STATE,
  ResumeBuilderState
} from '../../shared/models/resume-builder.model';

import { Router, ActivatedRoute } from '@angular/router';
import { EnvironmentRuntimeService } from './environment.service';

const STORAGE_KEY = 'rr_resume_builder_state_v1';

@Injectable({ providedIn: 'root' })
export class ResumeBuilderService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  /** SSR-safe browser check */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Resume state stored as a signal */
  state = signal<ResumeBuilderState>(EMPTY_RESUME_STATE);

  private autoSaveEnabled = true;
  private isDirty = false;

  constructor() {
    if (this.isBrowser()) {
      this.loadFromLocal();          // ✔ SSR safe
      this.listenToUrlResumeId();    // ✔ only browser
      this.setupAutoSave();          // ✔ only browser
    }
  }

  /** Convenience accessor */
  get snapshot(): ResumeBuilderState {
    return this.state();
  }

  // ---------------------------------------------------------------
  // HTTP HEADERS (SSR SAFE)
  // ---------------------------------------------------------------
  private getHeaders(): HttpHeaders {
    let token: string | null = null;
    if (this.isBrowser()) {
      try {
        token = localStorage.getItem('auth_token');
      } catch {}
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // ---------------------------------------------------------------
  // URL LISTENER (Browser Only)
  // ---------------------------------------------------------------
  private listenToUrlResumeId() {
    if (!this.isBrowser()) return;

    this.route.queryParamMap.subscribe(params => {
      const id = params.get('resumeId');
      const currentId = this.snapshot._id;

      if (id && id !== currentId) {
        this.loadSpecificResume(id);
      } else if (!id && currentId) {
        this.state.set(EMPTY_RESUME_STATE);
        this.saveToLocal();
      }
    });
  }

  // ---------------------------------------------------------------
  // LOAD SPECIFIC RESUME
  // ---------------------------------------------------------------
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

        if (this.isBrowser()) this.saveToLocal();
      });
  }

  loadDraftFromServer() {
    if (!this.isBrowser()) return;

    const id = this.route.snapshot.queryParamMap.get('resumeId');
    if (id) this.loadSpecificResume(id);
  }

  // ---------------------------------------------------------------
  // STATE OPERATIONS
  // ---------------------------------------------------------------
  update(partial: Partial<ResumeBuilderState>) {
    this.state.update(prev => ({ ...prev, ...partial }));
    this.isDirty = true;

    if (this.isBrowser()) this.saveToLocal();
  }

  replace(newState: ResumeBuilderState) {
    this.state.set(newState);
    this.isDirty = true;

    if (this.isBrowser()) this.saveToLocal();
  }

  startNewResume() {
    if (!this.isBrowser()) return;

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

  // ---------------------------------------------------------------
  // AUTO-SAVE (Browser Only)
  // ---------------------------------------------------------------
  private setupAutoSave() {
    if (!this.isBrowser()) return;

    effect(() => {
      const current = this.state();

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

    this.http.put(
      `${this.runtimeEnv.getApiUrl()}/custom-resume/draft/autosave`,
      payload,
      { headers: this.getHeaders() }
    )
    .pipe(
      catchError(err => {
        console.error('Auto-save failed:', err);
        if (this.isBrowser()) this.saveToLocal();
        return of(null);
      })
    )
    .subscribe((res: any) => {
      if (!res?.resume) return;

      this.isDirty = false;
      const newId = res.resume._id;

      if (!this.snapshot._id || this.snapshot._id !== newId) {
        this.state.update(prev => ({ ...prev, _id: newId }));
        if (this.isBrowser()) this.saveToLocal();
      }

      if (this.isBrowser()) {
        const currentId = this.route.snapshot.queryParamMap.get('resumeId');
        if (currentId !== newId) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { resumeId: newId },
            queryParamsHandling: 'merge'
          });
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // CRUD + AI
  // ---------------------------------------------------------------
  getAllResumes() {
    return this.http.get(`${this.runtimeEnv.getApiUrl()}/custom-resume/all`, {
      headers: this.getHeaders()
    });
  }

  getResume(id: string) {
    return this.http.get(`${this.runtimeEnv.getApiUrl()}/custom-resume/${id}`, {
      headers: this.getHeaders()
    });
  }

  deleteResume(id: string) {
    return this.http.delete(`${this.runtimeEnv.getApiUrl()}/custom-resume/${id}`, {
      headers: this.getHeaders()
    });
  }

  duplicateResume(id: string) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/custom-resume/${id}/duplicate`, {}, {
      headers: this.getHeaders()
    });
  }

  saveResume(isDraft = false) {
    const state = this.snapshot;
    const url = `${this.runtimeEnv.getApiUrl()}/custom-resume/${state._id || 'save'}`;
    const method = state._id ? 'PUT' : 'POST';

    return this.http.request(method, url, {
      body: { ...state, isDraft },
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        this.isDirty = false;
        if (this.isBrowser()) this.saveToLocal();
      })
    );
  }

  completeResume() {
    const state = this.snapshot;
    return this.http.post(
      `${this.runtimeEnv.getApiUrl()}/custom-resume/${state._id}/complete`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.isDirty = false;
        if (this.isBrowser()) this.saveToLocal();
      })
    );
  }

  generateWithAI(type: string, context: any) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/ai/generate`,
      { type, context },
      { headers: this.getHeaders() }
    );
  }

  generateSuggestions(type: string, context: any, count = 3) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/ai/suggestions`,
      { type, context, count },
      { headers: this.getHeaders() }
    );
  }

  improveContent(content: string, type?: string) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/ai/improve`,
      { content, type },
      { headers: this.getHeaders() }
    );
  }

  checkContent(content: string) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/ai/check`,
      { content },
      { headers: this.getHeaders() }
    );
  }

  exportPdf(template: string, resumeId: string) {
    const params = new HttpParams()
      .set('resumeId', resumeId)
      .set('template', template);

    return this.http.get(`${this.runtimeEnv.getApiUrl()}/custom-resume/pdf`, {
      headers: this.getHeaders(),
      params,
      responseType: 'blob' as const
    });
  }

  // ---------------------------------------------------------------
  // LOCAL STORAGE (SSR SAFE)
  // ---------------------------------------------------------------
  saveToLocal() {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch {}
  }

  loadFromLocal() {
    if (!this.isBrowser()) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      this.state.set({ ...EMPTY_RESUME_STATE, ...parsed });
    } catch {}
  }

  clearLocal() {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    this.state.set(EMPTY_RESUME_STATE);
  }

  enableAutoSave() { this.autoSaveEnabled = true; }
  disableAutoSave() { this.autoSaveEnabled = false; }
}
