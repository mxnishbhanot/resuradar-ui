import { Component, inject, OnInit } from '@angular/core';
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

// Types
type ResumeType = 'builder' | 'ats' | 'jd';
type FilterType = 'all' | ResumeType;

interface Resume {
  id: string;
  title: string;
  type: ResumeType;
  isDraft: boolean;
  updatedAt: string;
  completionPercentage?: number; // Builder specific
  atsScore?: number;             // ATS specific
  matchScore?: number;           // JD specific
  jobTitle?: string;             // JD specific
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
  // Data State
  builderResumes: Resume[] = [];
  atsResumes: Resume[] = [];
  jdResumes: Resume[] = [];
  paginatedResumes: Resume[] = [];

  // UI State
  currentPage = 1;
  itemsPerPage = 8; // Optimized for grid
  isLoading = true;
  activeFilter: FilterType = 'all';

  private router = inject(Router);
  private resumeBuilderService = inject(ResumeBuilderService);
  private resumeService = inject(ResumeService);

  ngOnInit(): void {
    this.loadAllResumes();
  }

  loadAllResumes(): void {
    this.isLoading = true;

    forkJoin({
      builder: this.resumeBuilderService.getAllResumes().pipe(catchError(() => of({ resumes: [] }))),
      ats: this.resumeService.getResumeHistory('ats').pipe(catchError(() => of({ data: [] }))),
      jd: this.resumeService.getResumeHistory('jd').pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: (results) => {
        console.log({results});

        // Map Builder
        if (results.builder?.resumes) {
          this.builderResumes = results.builder.resumes.map((r: any) => ({
            id: r._id || r.id,
            title: this.getBuilderTitle(r),
            type: 'builder',
            isDraft: r.isDraft ?? true,
            completionPercentage: r.completionPercentage || 0,
            updatedAt: r.updatedAt
          }));
        }

        // Map ATS
        if (results.ats?.data) {
          this.atsResumes = results.ats.data.map((r: any) => ({
            id: r._id,
            title: r.filename || 'ATS Scan',
            type: 'ats',
            isDraft: false,
            atsScore: r.score || 0,
            analysis: r.analysis,
            updatedAt: r.updatedAt,
            completionPercentage: r.score
          }));
        }

        // Map JD
        if (results.jd?.data) {
          this.jdResumes = results.jd.data.map((r: any) => ({
            id: r._id,
            title: r.filename || 'Job Match',
            type: 'jd',
            isDraft: false,
            matchScore: r.score || 0,
            jobTitle: r.jobDescription?.title,
            analysis: r.analysis,
            updatedAt: r.updatedAt,
            completionPercentage: r.score
          }));
        }

        this.updatePagination();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  // --- Logic Helpers ---

  getFilteredResumes(): Resume[] {
    let resumes: Resume[] = [];
    switch (this.activeFilter) {
      case 'all': resumes = [...this.builderResumes, ...this.atsResumes, ...this.jdResumes]; break;
      case 'builder': resumes = [...this.builderResumes]; break;
      case 'ats': resumes = [...this.atsResumes]; break;
      case 'jd': resumes = [...this.jdResumes]; break;
    }
    return resumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  updatePagination(): void {
    const filtered = this.getFilteredResumes();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedResumes = filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  createNew(): void { this.router.navigate(['/start']); }

  handleResumeClick(resume: Resume): void {
    if (resume.type === 'builder') this.router.navigate(['/build'], { queryParams: { resumeId: resume.id } });
    if (resume.type === 'ats') {
       this.resumeService.setLatestAnalysis(resume.analysis);
       this.router.navigate(['/analysis']);
    }
    if (resume.type === 'jd') {
      this.resumeService.setLatestMatchAnalysis(resume.analysis);
      this.router.navigate(['/match-results']);
    }
  }

  // --- UI Helpers ---

  get totalPages(): number { return Math.ceil(this.getFilteredResumes().length / this.itemsPerPage); }
  getTotalCount(): number { return this.builderResumes.length + this.atsResumes.length + this.jdResumes.length; }

  getTypeIcon(type: ResumeType): string {
    return type === 'builder' ? 'edit_document' : type === 'ats' ? 'analytics' : 'work';
  }

  getTypeLabel(type: ResumeType): string {
    return type === 'builder' ? 'Builder' : type === 'ats' ? 'ATS Scan' : 'Job Match';
  }

  getScoreClass(score: number | undefined): string {
    const s = score || 0;
    return s >= 80 ? 'score-high' : s >= 50 ? 'score-medium' : 'score-low';
  }

  getProgressClass(percentage: number | undefined): string {
    const p = percentage || 0;
    return p >= 80 ? 'progress-high' : p >= 50 ? 'progress-medium' : 'progress-low';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private getBuilderTitle(resume: any): string {
    return resume.personal?.headline || 'Untitled Resume';
  }

  getPageNumbers(): number[] {
    // Simplified logic for brevity, expands to [1, 2, ... 10]
    return Array.from({ length: this.totalPages }, (_, i) => i + 1).slice(0, 5);
  }

  // Empty State
  getEmptyStateTitle(): string { return 'No Resumes Found'; }
  getEmptyStateDescription(): string { return 'Create a new resume or upload one to get started.'; }
  getEmptyStateActionIcon(): string { return 'add_circle'; }
  getEmptyStateAction(): void { this.createNew(); }
}
