import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  EMPTY_RESUME_STATE,
  ResumeBuilderState,
} from '../../shared/models/resume-builder.model';

const STORAGE_KEY = 'rr_resume_builder_state_v1';

@Injectable({ providedIn: 'root' })
export class ResumeBuilderService {
  private stateSubject = new BehaviorSubject<ResumeBuilderState>(EMPTY_RESUME_STATE);
  state$ = this.stateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromLocal();
  }

  get snapshot(): ResumeBuilderState {
    return this.stateSubject.getValue();
  }

  update(partial: Partial<ResumeBuilderState>) {
    const next = { ...this.snapshot, ...partial } as ResumeBuilderState;
    this.stateSubject.next(next);
    this.saveToLocal();
  }

  replace(state: ResumeBuilderState) {
    this.stateSubject.next(state);
    this.saveToLocal();
  }

  saveToLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch (e) {
      // ignore localStorage failures
    }
  }

  loadFromLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ResumeBuilderState;
        this.stateSubject.next({ ...EMPTY_RESUME_STATE, ...parsed });
      }
    } catch (e) {
      // ignore
    }
  }

  clearLocal() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    this.stateSubject.next(EMPTY_RESUME_STATE);
  }

  /**
   * Call backend AI endpoint to generate content.
   * Assumption: backend exposes POST {environment.apiUrl}/ai/generate
   * with body: {type: 'experience'|'summary'|'personal', context: {...}}
   */
  generateWithAI(type: string, context: any): Observable<any> {
    // Defensive: if environment not configured, return empty observable
    if (!environment.apiUrl) {
      return of({ error: 'API not configured' });
    }

    const payload = { type, context };
    return this.http.post(`${environment.apiUrl.replace(/\/$/, '')}/ai/generate`, payload).pipe(
      tap((result: any) => {
        // the backend should return content; caller will handle where to merge
      })
    );
  }

  /**
   * Export printable resume by opening a new window and calling print.
   * This is intentionally light-weight; for richer PDF export consider
   * integrating html2pdf/jsPDF on the client or calling a server-side PDF service.
   */
  exportToPDF(htmlContent: string, title = 'resume') {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;

    const style = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin: 24px; }
        .rr-resume { max-width: 800px; margin: 0 auto; }
        h1,h2,h3 { color: #1f2430; }
      </style>
    `;

    printWindow.document.write(`<!doctype html><html><head><title>${title}</title>${style}</head><body>`);
    printWindow.document.write(htmlContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    // small delay to let fonts render
    setTimeout(() => printWindow.print(), 500);
  }
}
