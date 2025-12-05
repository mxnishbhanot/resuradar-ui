import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { debounce, tap, catchError, switchMap } from 'rxjs/operators';
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
    // Use the URL ID to trigger a load on initialization
    this.route.queryParamMap.pipe(
        // We only want to run the initial load when the component loads, not on subsequent parameter changes
        // unless the ID actually changes.
        tap(params => {
            const resumeId = params.get('resumeId');
            if (resumeId && this.snapshot._id !== resumeId) {
                // If a resumeId is in the URL but not in the state, load it.
                this.loadSpecificResume(resumeId);
            } else if (!resumeId && this.snapshot._id) {
                // If we land on a clean URL but have local state, clear state to start fresh.
                this.stateSubject.next(EMPTY_RESUME_STATE);
                this.saveToLocal();
            }
        })
    ).subscribe();
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

  // Loads a specific resume by ID from the server
  private loadSpecificResume(id: string): void {
      this.getResume(id).pipe(
          catchError(error => {
              console.error(`Failed to load resume ${id}:`, error);
              // Fallback to empty state and clear URL ID if load fails (e.g., ID is invalid)
              this.startNewResume();
              return of(null);
          })
      ).subscribe(response => {
          if (response?.resume) {
              const resume = response.resume;
              const state: ResumeBuilderState = {
                  _id: resume._id, // Set the ID from the response
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

  // Old `loadDraftFromServer` is now mainly used to handle initial/non-ID load logic.
  loadDraftFromServer(): void {
    const resumeId = this.route.snapshot.queryParamMap.get('resumeId');
    if (resumeId) {
        this.loadSpecificResume(resumeId);
    } else {
        // If no ID is present, we start clean. The local storage might have a previous state,
        // so we rely on the initial loadFromLocal() in the constructor.
        console.log('No resumeId in URL, starting new session.');
    }
  }


  update(partial: Partial<ResumeBuilderState>): void {
    // Merge partial update with existing state
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

  // --- NEW METHOD FOR "STARTING FROM SCRATCH" ---
  startNewResume(): void {
    // 1. Clear state locally (this triggers auto-save of empty data, which will create a new doc)
    this.clearLocal();
    this.stateSubject.next(EMPTY_RESUME_STATE);

    // 2. Clear the resumeId from the URL to signify a new, unsaved draft
    this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { resumeId: null }, // Remove resumeId from URL
        queryParamsHandling: 'merge'
    }).then(() => {
        console.log('Starting a new resume session (URL ID cleared).');
        // This is necessary to ensure the empty state is synced to the auto-save mechanism
        this.isDirty = true;
        this.autoSaveToServer();
    });
  }
  // ----------------------------------------------

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
    // CRITICAL FIX: Send the current _id (null if new) with the state
    const payload = {
        ...state,
        _id: state._id // Send the current ID or null/undefined
    };

    this.http.put(`${environment.apiUrl}/custom-resume/draft/autosave`, payload, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Auto-save failed:', error);
        this.saveToLocal();
        return of(null);
      })
    ).subscribe((response: any) => {
      if (response && response.resume) {
          this.isDirty = false;
          // 1. Update the local state with the new _id returned by the server
          if (!this.snapshot._id || this.snapshot._id !== response.resume._id) {
              this.stateSubject.next({ ...this.snapshot, _id: response.resume._id });
              this.saveToLocal(); // Resave local with new ID
          }

          // 2. Update the URL if it doesn't already have the correct ID
          const currentId = this.route.snapshot.queryParamMap.get('resumeId');
          if (currentId !== response.resume._id) {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { resumeId: response.resume._id },
              queryParamsHandling: 'merge'
            });
          }
          console.log('✅ Draft auto-saved at', response?.savedAt, 'ID:', response.resume._id);
      }
    });
  }

  // Manual save
  saveResume(isDraft: boolean = false): Observable<any> {
    const state = this.snapshot;
    // CRITICAL FIX: Ensure _id is sent for update, or omitted for new save
    const payload = {
        ...state,
        _id: state._id,
        isDraft
    };

    // Use a PUT request if ID exists for updating
    const url = `${environment.apiUrl}/custom-resume/${state._id ? state._id : 'save'}`;
    const method = state._id ? 'PUT' : 'POST';

    const save$ = this.http.request(method, url, {
        body: payload,
        headers: this.getHeaders()
    });

    return save$.pipe(
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
    // This calls the specific API endpoint that fetches by ID
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
    // IMPORTANT: When clearing locally, reset to EMPTY_RESUME_STATE which includes _id: null
    this.stateSubject.next(EMPTY_RESUME_STATE);
  }

  // AI Generation Methods... (rest of the service remains the same)
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
    // Use HttpParams for cleaner query parameters
    let params = new HttpParams()
        .set('resumeId', resumeId)
        .set('template', template);

    return this.http.get(`${environment.apiUrl}/custom-resume/pdf`, {
      headers: this.getHeaders(),
      params: params,
      responseType: 'blob' as 'json'
    });
  }
}
