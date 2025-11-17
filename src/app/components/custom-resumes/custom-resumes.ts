// src/app/features/custom-resumes/custom-resumes.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface CustomResume {
  id: string;
  title: string;
  isDraft: boolean;
  completionPercentage: number;
  updatedAt: string;
}

@Component({
  selector: 'rr-custom-resumes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './custom-resumes.html',
  styleUrls: ['./custom-resumes.scss']
})
export class CustomResumesComponent implements OnInit {
  resumes: CustomResume[] = [];
  paginatedResumes: CustomResume[] = [];
  currentPage = 1;
  itemsPerPage = 2;
  isLoading = true;

  private router = inject(Router);
  private resumeBuilderService = inject(ResumeBuilderService);

  ngOnInit(): void {
    this.loadResumes();
  }

  loadResumes(): void {
    this.resumeBuilderService.getAllResumes().subscribe({
      next: (res: any) => {
        if (res?.resumes && Array.isArray(res.resumes)) {
          this.resumes = res.resumes.map((r: any) => ({
            ...r,
            id: r._id,
            title: this.getTitle(r),
            isDraft: r.isDraft,
            completionPercentage: r.completionPercentage || 0,
            updatedAt: r.updatedAt
          }));
        } else {
          this.resumes = [];
        }
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load resumes', err);
        this.resumes = [];
        this.isLoading = false;
      }
    });
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedResumes = this.resumes.slice(startIndex, startIndex + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.resumes.length / this.itemsPerPage);
  }

  get draftCount(): number {
    return this.resumes.filter(r => r.isDraft).length;
  }

  get completedCount(): number {
    return this.resumes.filter(r => r.completionPercentage === 100).length;
  }

  createNew(): void {
    this.router.navigate(['/start-resume']);
  }

  editResume(resume: any): void {
    this.resumeBuilderService.replace(resume);
    this.router.navigate(['/build']);
  }

  getCompletionClass(percent: number): string {
    if (percent >= 80) return 'complete-high';
    if (percent >= 50) return 'complete-medium';
    return 'complete-low';
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

  private getTitle(resume: any): string {
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
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
