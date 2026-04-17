import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { forkJoin, merge, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CustomResumesListRefetchService } from '../../core/services/custom-resumes-list-refetch.service';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ResumeService } from '../../core/services/resume';
import { ToastService } from '../../core/services/toast';
import { UserService } from '../../core/services/user';
import { AtsResume, BuilderResume, JdResume, ResumeListResponse, ResumeType } from '../../shared/models/resume.model';
import { DeleteHistoryConfirmDialogComponent } from '../../shared/components/delete-history-confirm-dialog/delete-history-confirm-dialog';
import { DisplayNameDialogComponent } from '../../shared/components/display-name-dialog/display-name-dialog';

/** Card title: headline, else full name, else fallback (exported for unit tests). */
export function buildBuilderCardTitle(personal: BuilderResume['personal']): string {
  const headline = personal?.headline?.trim();
  if (headline) return headline;
  const first = personal?.firstName?.trim() ?? '';
  const last = personal?.lastName?.trim() ?? '';
  const full = [first, last].filter(Boolean).join(' ');
  if (full) return full;
  return 'Untitled Resume';
}

/** Locale-aware "last updated" label with same-day freshness (exported for unit tests). */
export function formatResumeUpdatedAt(dateStr: string, now = new Date()): string {
  if (!dateStr?.trim()) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit'
  };
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `Today, ${d.toLocaleTimeString(undefined, timeOpts)}`;
  }
  const datePart = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timePart = d.toLocaleTimeString(undefined, timeOpts);
  return `${datePart}, ${timePart}`;
}

interface UnifiedResume {
  id: string;
  title: string;
  type: ResumeType;
  isDraft: boolean;
  updatedAt: string;
  completionPercentage: number;
  atsScore?: number;
  matchScore?: number;
  jobTitle?: string;
  analysis?: any;
  filename?: string;
  displayName?: string | null;
}

type FilterType = 'all' | ResumeType;

@Component({
  selector: 'rr-custom-resumes',
  standalone: true,
  templateUrl: './custom-resumes.html',
  styleUrls: ['./custom-resumes.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class CustomResumesComponent implements OnInit {

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private resumeBuilderService = inject(ResumeBuilderService);
  private resumeService = inject(ResumeService);
  private listRefetchBus = inject(CustomResumesListRefetchService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private userService = inject(UserService);

  // Signals for all resume categories
  builderResumes = signal<UnifiedResume[]>([]);
  atsResumes = signal<UnifiedResume[]>([]);
  jdResumes = signal<UnifiedResume[]>([]);

  // UI signals
  isLoading = signal<boolean>(true);
  activeFilter = signal<FilterType>('all');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(8);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const onPageShow = (event: Event) => {
        const pe = event as PageTransitionEvent;
        if (pe.persisted) {
          this.loadAllResumes();
        }
      };
      window.addEventListener('pageshow', onPageShow);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('pageshow', onPageShow);
      });
    }
  }

  ngOnInit(): void {
    merge(of(null), this.listRefetchBus.reenteredList)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAllResumes());
  }

  // -------------------------------
  // LOAD ALL RESUME SOURCES STRICTLY
  // -------------------------------
  loadAllResumes(): void {
    this.isLoading.set(true);

    forkJoin({
      builder: this.resumeBuilderService.getAllResumes().pipe(
        catchError(() => of({ resumes: [] } satisfies ResumeListResponse<BuilderResume>))
      ),
      ats: this.resumeService.getResumeHistory('ats').pipe(
        catchError(() => of({ data: [] } satisfies ResumeListResponse<AtsResume>))
      ),
      jd: this.resumeService.getResumeHistory('jd').pipe(
        catchError(() => of({ data: [] } satisfies ResumeListResponse<JdResume>))
      )
    }).subscribe({
      next: (results) => {
        // -------------------------
        // SAFE EXTRACTION HELPERS
        // -------------------------
        const extract = <T>(res: ResumeListResponse<T>): T[] =>
          Array.isArray(res.resumes) ? res.resumes :
            Array.isArray(res.data) ? res.data :
              [];

        const builderList = extract(results.builder);
        const atsList = extract(results.ats);
        const jdList = extract(results.jd);

        // -------------------------
        // NORMALIZATION TO UNIFIED FORMAT
        // -------------------------
        this.builderResumes.set(
          builderList.map((r: BuilderResume) => ({
            id: r._id,
            title: buildBuilderCardTitle(r.personal),
            type: 'builder',
            isDraft: r.isDraft,
            updatedAt: r.updatedAt,
            completionPercentage: r.completionPercentage ?? 0
          }))
        );

        this.atsResumes.set(
          atsList.map((r: any) => {
            const dn = typeof r.displayName === 'string' ? r.displayName.trim() : '';
            return {
              id: r._id,
              title: dn || r.filename || 'ATS Scan',
              type: 'ats' as const,
              isDraft: false,
              updatedAt: r.updatedAt,
              completionPercentage: r.score ?? 0,
              atsScore: r.score ?? 0,
              analysis: r.analysis,
              filename: r.filename,
              displayName: r.displayName ?? null
            };
          })
        );

        this.jdResumes.set(
          jdList.map((r: any) => {
            const dn = typeof r.displayName === 'string' ? r.displayName.trim() : '';
            return {
              id: r._id,
              title: dn || r.filename || 'Job Match',
              type: 'jd' as const,
              isDraft: false,
              updatedAt: r.updatedAt,
              completionPercentage: r.score ?? 0,
              matchScore: r.score ?? 0,
              jobTitle: r.jobDescription?.title,
              analysis: r.analysis,
              filename: r.filename,
              displayName: r.displayName ?? null
            };
          })
        );

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // -------------------------------
  // COMPUTED SIGNALS
  // -------------------------------
  allResumes = computed(() => [
    ...this.builderResumes(),
    ...this.atsResumes(),
    ...this.jdResumes()
  ]);

  filteredResumes = computed(() => {
    const filter = this.activeFilter();

    let list =
      filter === 'builder' ? this.builderResumes() :
        filter === 'ats' ? this.atsResumes() :
          filter === 'jd' ? this.jdResumes() :
            this.allResumes();

    return [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredResumes().length / this.itemsPerPage())
  );

  paginatedResumes = computed(() => {
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    return this.filteredResumes().slice(start, start + perPage);
  });

  pageNumbers = computed(() => {
    const pages = this.totalPages();
    return Array.from({ length: pages }, (_, i) => i + 1).slice(0, 5);
  });

  totalCount = computed(() =>
    this.builderResumes().length +
    this.atsResumes().length +
    this.jdResumes().length
  );

  // -------------------------------
  // UI HANDLERS
  // -------------------------------
  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  createNew(): void {
    this.router.navigate(['/start']);
  }

  handleResumeClick(resume: UnifiedResume): void {
    if (resume.type === 'builder') {
      this.router.navigate(['/build'], { queryParams: { resumeId: resume.id } });
      return;
    }

    if (resume.type === 'ats') {
      this.resumeService.setLatestAnalysis(resume.analysis);
      this.router.navigate(['/analysis']);
      return;
    }

    if (resume.type === 'jd') {
      this.resumeService.setLatestMatchAnalysis(resume.analysis);
      this.router.navigate(['/match-results']);
    }
  }

  getTypeIcon(type: ResumeType): string {
    return type === 'builder' ? 'edit_document' :
      type === 'ats' ? 'analytics' :
        'work';
  }

  getTypeLabel(type: ResumeType): string {
    return type === 'builder' ? 'Builder' :
      type === 'ats' ? 'ATS Scan' :
        'Job Match';
  }

  getScoreClass(score = 0): string {
    return score >= 80 ? 'score-high' :
      score >= 50 ? 'score-medium' :
        'score-low';
  }

  getProgressClass(p = 0): string {
    return p >= 80 ? 'progress-high' :
      p >= 50 ? 'progress-medium' :
        'progress-low';
  }

  formatDate(dateStr: string): string {
    return formatResumeUpdatedAt(dateStr);
  }

  getEmptyStateTitle(): string {
    return 'No Resumes Found';
  }

  getEmptyStateDescription(): string {
    return 'Create a new resume or upload one to begin.';
  }

  getEmptyStateActionIcon(): string {
    return 'add_circle';
  }

  getEmptyStateAction(): void {
    this.createNew();
  }

  openRenameHistory(event: MouseEvent, resume: UnifiedResume): void {
    event.stopPropagation();
    if (resume.type !== 'ats' && resume.type !== 'jd') return;
    const initial =
      (resume.displayName && resume.displayName.trim()) || resume.filename || '';
    const ref = this.dialog.open(DisplayNameDialogComponent, {
      width: 'min(400px, 92vw)',
      data: { initialName: initial }
    });
    ref.afterClosed().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((result: string | undefined) => {
      if (result === undefined) return;
      this.resumeService.patchResumeDisplayName(resume.id, result).subscribe({
        next: () => {
          this.toast.show('success', 'Updated', 'Display name saved.');
          this.loadAllResumes();
        },
        error: () => this.toast.show('error', 'Error', 'Could not update the display name.')
      });
    });
  }

  confirmDeleteHistory(event: MouseEvent, resume: UnifiedResume): void {
    event.stopPropagation();
    if (resume.type !== 'ats' && resume.type !== 'jd') return;
    const kindLabel = resume.type === 'ats' ? 'ATS scan' : 'job match';
    const ref = this.dialog.open(DeleteHistoryConfirmDialogComponent, {
      width: 'min(400px, 92vw)',
      data: { kindLabel }
    });
    ref.afterClosed().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) return;
      this.resumeService.deleteResumeHistory(resume.id).subscribe({
        next: () => {
          this.toast.show('success', 'Deleted', 'Analysis removed from your dashboard.');
          this.loadAllResumes();
          this.userService.fetchCurrentUser().subscribe();
        },
        error: () => this.toast.show('error', 'Error', 'Could not delete this analysis.')
      });
    });
  }
}
