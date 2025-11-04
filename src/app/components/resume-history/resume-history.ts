import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ResumeService } from '../../core/services/resume';
import { GoogleAuthService } from '../../core/services/google-auth';
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
  private router = inject(Router);
  private location = inject(Location);
  private resumeService = inject(ResumeService);

  ngOnInit() {
    this.resumeService.getResumeHistory().subscribe((result) => {
      this.resumes = result.data;
    });
  }


  getScoreClass(score: number): string {
    if (score >= 8) return 'score-excellent';
    if (score >= 6) return 'score-good';
    return 'score-needs-work';
  }

  viewResume(resume: ResumeItem) {
    if(resume.type === 'job_match') {
      this.resumeService.setLatestMatchAnalysis(resume.analysis);
      this.router.navigate(['/match-results']);
      return;
    }
    this.resumeService.setLatestAnalysis(resume.analysis);
    this.router.navigate(['/analysis']);
  }

  goToUpload() {
    this.router.navigate(['']);
  }

  goBack() {
    this.location.back(); // Navigates to the previous page in history
  }
}
