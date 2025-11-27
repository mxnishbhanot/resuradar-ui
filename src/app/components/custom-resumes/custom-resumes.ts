// src/app/features/custom-resumes/custom-resumes.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ResumeService } from '../../core/services/resume';

type ResumeType = 'builder' | 'ats' | 'jd';
type FilterType = 'all' | ResumeType;

interface BaseResume {
  id: string;
  title: string;
  type: ResumeType;
  isDraft: boolean;
  updatedAt: string;
}

interface BuilderResume extends BaseResume {
  type: 'builder';
  completionPercentage: number;
}

interface ATSResume extends BaseResume {
  type: 'ats';
  atsScore: number;
  analysis: any
}

interface JDResume extends BaseResume {
  type: 'jd';
  matchScore: number;
  jobTitle?: string;
  analysis: any
}

type Resume = BuilderResume | ATSResume | JDResume;

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
  builderResumes: BuilderResume[] = [];
  atsResumes: ATSResume[] = [];
  jdResumes: JDResume[] = [];

  paginatedResumes: Resume[] = [];
  currentPage = 1;
  itemsPerPage = 5;
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

    // Load all three types of resumes in parallel
    forkJoin({
      builder: this.resumeBuilderService.getAllResumes().pipe(
        catchError(err => {
          console.error('Failed to load builder resumes', err);
          return of({ resumes: [] });
        })
      ),
      ats: this.resumeService.getResumeHistory('ats').pipe(
        catchError(err => {
          console.error('Failed to load ATS resumes', err);
          return of({ resumes: [] });
        })
      ),
      jd: this.resumeService.getResumeHistory('jd').pipe(
        catchError(err => {
          console.error('Failed to load JD resumes', err);
          return of({ resumes: [] });
        })
      )
    }).subscribe({
      next: (results) => {
        console.log(results.jd);

        // Process builder resumes
        if (results.builder?.resumes && Array.isArray(results.builder.resumes)) {
          this.builderResumes = results.builder.resumes.map((r: any) => ({
            id: r._id || r.id,
            title: this.getBuilderTitle(r),
            type: 'builder' as const,
            isDraft: r.isDraft ?? true,
            completionPercentage: r.completionPercentage || 0,
            updatedAt: r.updatedAt || new Date().toISOString()
          }));
        }

        // Process ATS resumes
        if (results.ats?.data && Array.isArray(results.ats.data)) {
          this.atsResumes = results.ats.data.map((r: any) => ({
            ...r,
            id: r._id || r.id,
            title: r.filename || r.title || 'ATS Resume',
            type: 'ats' as const,
            isDraft: false,
            atsScore: r.score || 0,
            updatedAt: r.analyzedAt || r.updatedAt || new Date().toISOString()
          }));
        }

        // Process JD resumes
        if (results.jd?.data && Array.isArray(results.jd.data)) {
          this.jdResumes = results.jd.data.map((r: any) => ({
            ...r,
            id: r._id || r.id,
            title: r.filename || r.title || 'Job Match Resume',
            type: 'jd' as const,
            isDraft: false,
            matchScore: r.matchScore || r.score || 0,
            jobTitle: r.jobTitle || r.jobDescription?.title,
            updatedAt: r.matchedAt || r.updatedAt || new Date().toISOString()
          }));
        }

        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load resumes', err);
        this.isLoading = false;
      }
    });
  }

  getFilteredResumes(): Resume[] {
    let resumes: Resume[] = [];

    switch (this.activeFilter) {
      case 'all':
        resumes = [...this.builderResumes, ...this.atsResumes, ...this.jdResumes];
        break;
      case 'builder':
        resumes = [...this.builderResumes];
        break;
      case 'ats':
        resumes = [...this.atsResumes];
        break;
      case 'jd':
        resumes = [...this.jdResumes];
        break;
    }

    // Sort by updatedAt (most recent first)
    return resumes.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
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

  get totalPages(): number {
    return Math.ceil(this.getFilteredResumes().length / this.itemsPerPage);
  }

  get draftCount(): number {
    return this.builderResumes.filter(r => r.isDraft).length;
  }

  getTotalCount(): number {
    return this.builderResumes.length + this.atsResumes.length + this.jdResumes.length;
  }

  createNew(): void {
    this.router.navigate(['/start']);
  }

  handleResumeClick(resume: Resume): void {
    switch (resume.type) {
      case 'builder':
        this.editResume(resume);
        break;
      case 'ats':
        this.viewATSDetails(resume);
        break;
      case 'jd':
        this.viewJDDetails(resume);
        break;
    }
  }

  editResume(resume: Resume): void {
    if (resume.type === 'builder') {
      // Load the resume data and navigate to builder
      console.log(resume);

      this.resumeBuilderService.getResume(resume.id).subscribe({
        next: (data: any) => {
          this.resumeBuilderService.replace(data.resume);
          this.router.navigate(['/build'], { queryParams: { resumeId: resume.id } });
        },
        error: (err) => console.error('Failed to load resume', err)
      });
    }
  }

  viewATSDetails(resume: Resume): void {
    if (resume.type === 'ats') {
       this.resumeService.setLatestAnalysis(resume.analysis);
      this.router.navigate(['/analysis']);
    }
  }

  viewJDDetails(resume: Resume): void {
    if (resume.type === 'jd') {
     this.resumeService.setLatestMatchAnalysis(resume.analysis);
      this.router.navigate(['/match-results']);
    }
  }

  downloadResume(resume: Resume): void {
    console.log('Download resume:', resume);
    // Implement download logic based on resume type
    // You'll need to call appropriate service methods
  }

  openMenu(resume: Resume, event: Event): void {
    event.stopPropagation();
    console.log('Open menu for:', resume);
    // Implement context menu logic (delete, duplicate, etc.)
  }

  getTypeIcon(type: ResumeType): string {
    switch (type) {
      case 'builder': return 'edit_document';
      case 'ats': return 'analytics';
      case 'jd': return 'work';
      default: return 'description';
    }
  }

  getTypeLabel(type: ResumeType): string {
    switch (type) {
      case 'builder': return 'Built';
      case 'ats': return 'ATS Check';
      case 'jd': return 'JD Match';
      default: return 'Resume';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  private getBuilderTitle(resume: any): string {
    if (resume.personal?.headline) {
      return resume.personal.headline.trim();
    }
    const name = [resume.personal?.firstName, resume.personal?.lastName]
      .filter(n => n?.trim())
      .join(' ')
      .trim();
    return name || 'Untitled Resume';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const total = this.totalPages;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    let start = Math.max(2, this.currentPage - 1);
    let end = Math.min(total - 1, this.currentPage + 1);

    // Adjust range if near boundaries
    if (this.currentPage <= 3) {
      end = 4;
    } else if (this.currentPage >= total - 2) {
      start = total - 3;
    }

    // Add ellipsis if needed
    if (start > 2) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (end < total - 1) {
      pages.push(-1);
    }

    // Always show last page
    if (total > 1) {
      pages.push(total);
    }

    return pages;
  }

  // Empty state helpers
  getEmptyStateIcon(): string {
    switch (this.activeFilter) {
      case 'builder': return 'edit_document';
      case 'ats': return 'analytics';
      case 'jd': return 'work';
      default: return 'folder_open';
    }
  }

  getEmptyStateTitle(): string {
    switch (this.activeFilter) {
      case 'builder': return 'No Built Resumes';
      case 'ats': return 'No ATS Analyzed Resumes';
      case 'jd': return 'No Job Matched Resumes';
      default: return 'No Resumes Yet';
    }
  }

  getEmptyStateDescription(): string {
    switch (this.activeFilter) {
      case 'builder':
        return 'Start building your professional resume with our easy-to-use resume builder.';
      case 'ats':
        return 'Upload a resume to check its ATS compatibility and get improvement suggestions.';
      case 'jd':
        return 'Match your resume against job descriptions to see how well you fit the role.';
      default:
        return 'Get started by creating your first resume, checking ATS scores, or matching with job descriptions.';
    }
  }

  getEmptyStateActionText(): string {
    switch (this.activeFilter) {
      case 'builder': return 'Create Resume';
      case 'ats': return 'Check ATS Score';
      case 'jd': return 'Match with Job';
      default: return 'Get Started';
    }
  }

  getEmptyStateActionIcon(): string {
    switch (this.activeFilter) {
      case 'builder': return 'add_circle_outline';
      case 'ats': return 'upload_file';
      case 'jd': return 'work_outline';
      default: return 'rocket_launch';
    }
  }

  getEmptyStateAction(): void {
    switch (this.activeFilter) {
      case 'builder':
        this.router.navigate(['/start-resume']);
        break;
      case 'ats':
        this.router.navigate(['/ats-checker']);
        break;
      case 'jd':
        this.router.navigate(['/jd-matcher']);
        break;
      default:
        this.router.navigate(['/start-resume']);
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 80) return 'progress-high';
    if (percentage >= 50) return 'progress-medium';
    return 'progress-low';
  }
}
