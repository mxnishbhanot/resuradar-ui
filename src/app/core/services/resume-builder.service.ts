import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, of, throwError, Subject, merge } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import {
  EMPTY_RESUME_STATE,
  normalizeTemplateSettings,
  ResumeBuilderState,
  type BuilderTemplateId,
} from '../../shared/models/resume-builder.model';
import { Router, ActivatedRoute } from '@angular/router';
import { EnvironmentRuntimeService } from './environment.service';
import { ToastService } from './toast';
import { GoogleAuthService } from './google-auth';

const STORAGE_KEY = 'rr_resume_builder_state_v1';

@Injectable({ providedIn: 'root' })
export class ResumeBuilderService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);
  private toast = inject(ToastService);
  private googleAuth = inject(GoogleAuthService);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  state = signal<ResumeBuilderState>(EMPTY_RESUME_STATE);

  private autoSaveEnabled = true;
  private isDirty = false;
  private readonly autoSaveDebounced = new Subject<void>();
  private readonly autoSaveImmediate = new Subject<void>();

  constructor() {
    if (this.isBrowser()) {
      this.loadFromLocal();
      this.listenToUrlResumeId();

      merge(
        this.autoSaveImmediate,
        this.autoSaveDebounced.pipe(debounceTime(2000))
      )
        .pipe(
          filter(() => this.isDirty && this.autoSaveEnabled),
          switchMap(() => this.runAutoSaveHttp())
        )
        .subscribe();

      effect(() => {
        this.state();
        if (!this.isDirty || !this.autoSaveEnabled) return;
        this.autoSaveDebounced.next();
      });
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

        const theme = (res.resume.theme as BuilderTemplateId) || 'modern';
        const templateSettings = normalizeTemplateSettings(theme, res.resume.templateSettings);
        this.state.set({
          _id: res.resume._id,
          personal: res.resume.personal || {},
          educations: res.resume.educations || [],
          experiences: res.resume.experiences || [],
          skills: res.resume.skills || [],
          projects: res.resume.projects || [],
          theme,
          templateSettings,
          colorScheme: templateSettings.appearance!.colorMode,
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
    this.state.update((prev) => {
      const merged = { ...prev, ...partial };
      const theme = merged.theme || 'modern';
      let rawTemplateSettings = merged.templateSettings;
      if (partial.colorScheme !== undefined && partial.templateSettings === undefined) {
        rawTemplateSettings = {
          ...merged.templateSettings,
          appearance: {
            ...(merged.templateSettings?.appearance || {}),
            colorMode: partial.colorScheme,
          },
        };
      }
      const templateSettings = normalizeTemplateSettings(theme, rawTemplateSettings);
      return {
        ...merged,
        templateSettings,
        colorScheme: templateSettings.appearance!.colorMode,
      };
    });
    this.isDirty = true;
    if (this.isBrowser()) this.saveToLocal();
  }

  /** Replace in-memory state (e.g. parsed upload). Normalizes template settings and colorScheme. */
  replace(resume: Partial<ResumeBuilderState> & { _id?: string | null }) {
    const theme = (resume.theme as BuilderTemplateId) || 'modern';
    const templateSettings = normalizeTemplateSettings(theme, resume.templateSettings);
    this.state.set({
      _id: resume._id ?? null,
      personal: resume.personal || {},
      educations: resume.educations || [],
      experiences: resume.experiences || [],
      skills: resume.skills || [],
      projects: resume.projects || [],
      theme,
      templateSettings,
      colorScheme: templateSettings.appearance!.colorMode,
    });
    this.isDirty = true;
    if (this.isBrowser()) this.saveToLocal();
  }

  startNewResume() {
    if (!this.isBrowser()) return;

    this.clearLocal();
    const email = this.googleAuth.user()?.email?.trim();
    this.state.set({
      ...EMPTY_RESUME_STATE,
      personal: {
        ...EMPTY_RESUME_STATE.personal,
        ...(email ? { email } : {}),
      },
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { resumeId: null },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.isDirty = true;
      this.autoSaveImmediate.next();
    });
  }

  private autoSaveFailureMessage(err: unknown): string {
    const e = err as { error?: { message?: string; error?: string } };
    return e?.error?.message || e?.error?.error || 'Check your connection and try again.';
  }

  private runAutoSaveHttp() {
    const s = this.snapshot;
    const payload = { ...this.toResumePayload(s), _id: s._id };

    return this.http
      .put<{ resume: { _id: string } & Partial<ResumeBuilderState> }>(
        `${this.runtimeEnv.getApiUrl()}/custom-resume/draft/autosave`,
        payload
      )
      .pipe(
        tap((res) => {
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
        }),
        catchError(err => {
          console.error('Auto-save failed:', err);
          this.toast.show(
            'error',
            'Could not save draft',
            this.autoSaveFailureMessage(err),
            8000
          );
          if (this.isBrowser()) this.saveToLocal();
          return of(null);
        })
      );
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
      body: { ...this.toResumePayload(state), isDraft }
    }).pipe(
      tap(() => {
        this.isDirty = false;
        if (this.isBrowser()) this.saveToLocal();
      })
    );
  }

  completeResume() {
    const state = this.snapshot;
    if (!state._id) {
      return throwError(
        () => new Error('Resume has not been saved to the server yet. Wait for autosave or try again.')
      );
    }
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

  /** HTML preview from current in-memory state (POST). */
  renderPreviewHtml(template: BuilderTemplateId, state: ResumeBuilderState) {
    const resume = this.toResumePayload(state);
    return this.http.post(`${this.runtimeEnv.getApiUrl()}/custom-resume/render-preview`, {
      template,
      resume,
    }, { responseType: 'text' as const });
  }

  /** Mongo-backed HTML preview (GET). */
  getPreviewHtmlByResumeId(resumeId: string, template: BuilderTemplateId) {
    const params = new HttpParams().set('template', template);
    return this.http.get(
      `${this.runtimeEnv.getApiUrl()}/custom-resume/${resumeId}/preview-html`,
      { params, responseType: 'text' as const }
    );
  }

  /** Body for autosave / preview: resume fields + templateSettings (no Angular-only noise). */
  toResumePayload(state: ResumeBuilderState): Record<string, unknown> {
    const theme = state.theme || 'modern';
    return {
      _id: state._id,
      personal: state.personal,
      educations: state.educations,
      experiences: state.experiences,
      skills: state.skills,
      projects: state.projects,
      templateSettings: normalizeTemplateSettings(theme, state.templateSettings),
    };
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
      const parsed = JSON.parse(raw) as Partial<ResumeBuilderState>;
      const merged = { ...EMPTY_RESUME_STATE, ...parsed };
      const theme = merged.theme || 'modern';
      const templateSettings = normalizeTemplateSettings(theme, merged.templateSettings);
      this.state.set({
        ...merged,
        theme,
        templateSettings,
        colorScheme: templateSettings.appearance!.colorMode,
      });
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
