import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  state = signal<ResumeBuilderState>(EMPTY_RESUME_STATE);

  private autoSaveEnabled = true;
  private isDirty = false;

  constructor() {
    if (this.isBrowser()) {
      this.loadFromLocal();
      this.listenToUrlResumeId();
      this.setupAutoSave();
    }
  }

  get snapshot(): ResumeBuilderState {
    return this.state();
  }

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
    const payload = { ...this.snapshot, _id: this.snapshot._id };

    this.http.put(`${this.runtimeEnv.getApiUrl()}/custom-resume/draft/autosave`, payload)
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

  getAllResumes() {
    return this.http.get(`${this.runtimeEnv.getApiUrl()}/custom-resume/all`);
  }

  getResume(id: string) {
    return this.http.get(`${this.runtimeEnv.getApiUrl()}/custom-resume/${id}`);
  }

  deleteResume(id: string) {
    return this.http.delete(`${this.runtimeEnv.getApiUrl()}/custom-resume/${id}`);
  }

  duplicateResume(id: string) {
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/custom-resume/${id}/duplicate`, {});
  }

  saveResume(isDraft = false) {
    const state = this.snapshot;
    const url = `${this.runtimeEnv.getApiUrl()}/custom-resume/${state._id || 'save'}`;
    const method = state._id ? 'PUT' : 'POST';

    return this.http.request(method, url, {
      body: { ...state, isDraft }
    }).pipe(
      tap(() => {
        this.isDirty = false;
        if (this.isBrowser()) this.saveToLocal();
      })
    );
  }

  completeResume() {
    const state = this.snapshot;
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/custom-resume/${state._id}/complete`, {})
      .pipe(
        tap(() => {
          this.isDirty = false;
          if (this.isBrowser()) this.saveToLocal();
        })
      );
  }

  exportPdf(template: string, resumeId: string) {
    const params = new HttpParams()
      .set('resumeId', resumeId)
      .set('template', template);

    return this.http.get(`${this.runtimeEnv.getApiUrl()}/custom-resume/pdf`, {
      params,
      responseType: 'blob' as const
    });
  }

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
