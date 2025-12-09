import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ResumeService } from '../../core/services/resume';

type ResumeType = 'builder' | 'ats' | 'jd';
type FilterType = 'all' | ResumeType;

interface Resume {
  id: string;
  title: string;
  type: ResumeType;
  isDraft: boolean;
  updatedAt: string;
  completionPercentage?: number;
  atsScore?: number;
  matchScore?: number;
  jobTitle?: string;
  analysis?: any;
}

@Component({
  selector: 'rr-custom-resumes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './custom-resumes.html',
  styleUrls: ['./custom-resumes.scss']
})
export class CustomResumesComponent implements OnInit {

  // --- Signals for Resume Buckets ---
  builderResumes = signal<Resume[]>([]);
  atsResumes = signal<Resume[]>([]);
  jdResumes = signal<Resume[]>([]);

  // UI Signals
  isLoading = signal<boolean>(true);
  activeFilter = signal<FilterType>('all');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(8);

  private router = inject(Router);
  private resumeBuilderService = inject(ResumeBuilderService);
  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.loadAllResumes();
  }

  loadAllResumes(): void {
    this.isLoading.set(true);

    forkJoin({
      builder: this.resumeBuilderService.getAllResumes().pipe(catchError(() => of({ resumes: [] }))),
      ats: this.resumeService.getResumeHistory('ats').pipe(catchError(() => of({ data: [] }))),
      jd: this.resumeService.getResumeHistory('jd').pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: (results) => {

        // Builder
        this.builderResumes.set(
          (results.builder?.resumes || []).map((r: any) => ({
            id: r._id || r.id,
            title: this.getBuilderTitle(r),
            type: 'builder',
            isDraft: r.isDraft ?? true,
            completionPercentage: r.completionPercentage || 0,
            updatedAt: r.updatedAt
          }))
        );

        // ATS scans
        this.atsResumes.set(
          (results.ats?.data || []).map((r: any) => ({
            id: r._id,
            title: r.filename || 'ATS Scan',
            type: 'ats',
            isDraft: false,
            atsScore: r.score || 0,
            analysis: r.analysis,
            updatedAt: r.updatedAt,
            completionPercentage: r.score
          }))
        );

        // Job Match scans
        this.jdResumes.set(
          (results.jd?.data || []).map((r: any) => ({
            id: r._id,
            title: r.filename || 'Job Match',
            type: 'jd',
            isDraft: false,
            matchScore: r.score || 0,
            jobTitle: r.jobDescription?.title,
            analysis: r.analysis,
            updatedAt: r.updatedAt,
            completionPercentage: r.score
          }))
        );

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  allResumes = computed(() => [
    ...this.builderResumes(),
    ...this.atsResumes(),
    ...this.jdResumes()
  ]);

  filteredResumes = computed<Resume[]>(() => {
    const filter = this.activeFilter();
    let list;

    switch (filter) {
      case 'builder': list = this.builderResumes(); break;
      case 'ats':     list = this.atsResumes(); break;
      case 'jd':      list = this.jdResumes(); break;
      default:        list = this.allResumes();
    }

    return [...list].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredResumes().length / this.itemsPerPage())
  );

  paginatedResumes = computed<Resume[]>(() => {
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

  handleResumeClick(resume: Resume): void {
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
           type === 'ats'     ? 'analytics' :
                                'work';
  }

  getTypeLabel(type: ResumeType): string {
    return type === 'builder' ? 'Builder' :
           type === 'ats'     ? 'ATS Scan' :
                                'Job Match';
  }

  getScoreClass(score?: number): string {
    const s = score || 0;
    return s >= 80 ? 'score-high' : s >= 50 ? 'score-medium' : 'score-low';
  }

  getProgressClass(percentage?: number): string {
    const p = percentage || 0;
    return p >= 80 ? 'progress-high' : p >= 50 ? 'progress-medium' : 'progress-low';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getBuilderTitle(resume: any): string {
    return resume.personal?.headline || 'Untitled Resume';
  }

  // Empty State Helpers
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
}
