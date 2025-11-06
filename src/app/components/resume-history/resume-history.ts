import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ResumeService } from '../../core/services/resume';
import { MatChipsModule } from '@angular/material/chips';

interface ResumeItem {
  id: string;
  filename: string;
  createdAt: string;
  score: number;
  analysis?: any;
  type: string;
}

@Component({
  selector: 'app-resume-history',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './resume-history.html',
  styleUrl: './resume-history.scss',
})
export class ResumeHistory {
  resumes: ResumeItem[] = [];
  currentPage = 1;
  itemsPerPage = 5;

  private router = inject(Router);
  private location = inject(Location);
  private resumeService = inject(ResumeService);

  ngOnInit() {
    this.resumeService.getResumeHistory().subscribe((result) => {
      this.resumes = result.data || [];
      this.currentPage = 1; // reset to first page on data load
    });
  }

  get paginatedResumes(): ResumeItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.resumes.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.resumes.length / this.itemsPerPage);
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getScoreClass(score: number): string {
    if (score >= 8) return 'score-excellent';
    if (score >= 6) return 'score-good';
    return 'score-needs-work';
  }

  viewResume(resume: ResumeItem) {
    if (resume.type === 'job_match') {
      this.resumeService.setLatestMatchAnalysis(resume.analysis);
      this.router.navigate(['/match-results']);
      return;
    }
    this.resumeService.setLatestAnalysis(resume.analysis);
      this.router.navigate(['/analysis']);
  }

  goBack() {
    this.location.back();
  }
}
