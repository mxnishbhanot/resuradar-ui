import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ResumeService } from '../../core/services/resume';
import { GoogleAuthService } from '../../core/services/google-auth';

interface ResumeItem {
  id: string;
  fileName: string;
  analyzedAt: string; // ISO string
  score: number;
  position?: string;
}

@Component({
  selector: 'app-resume-history',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './resume-history.html',
  styleUrl: './resume-history.scss',
})
export class ResumeHistory {
  private router = inject(Router);
  private location = inject(Location);
  private resumeService = inject(ResumeService);

  // Mock data — replace with real API if available
  resumes: ResumeItem[] = [
    {
      id: '1',
      fileName: 'Senior_Developer_Resume.pdf',
      analyzedAt: '2025-04-10T10:00:00Z',
      score: 8.2,
      position: 'Senior Full Stack Developer'
    },
    {
      id: '2',
      fileName: 'Tech_Lead_Resume_v2.pdf',
      analyzedAt: '2025-03-22T14:30:00Z',
      score: 6.5,
      position: 'Technical Lead'
    },
    {
      id: '3',
      fileName: 'Updated_Portfolio_Resume.pdf',
      analyzedAt: '2025-02-15T09:15:00Z',
      score: 7.8,
      position: 'Software Architect'
    }
  ];

  getScoreClass(score: number): string {
    if (score >= 8) return 'score-excellent';
    if (score >= 6) return 'score-good';
    return 'score-needs-work';
  }

  viewResume(resume: ResumeItem) {
    const mockAnalysis = {
      score: resume.score,
      free_feedback: {
        summary: `Previously analyzed for ${resume.position || 'a role'}.`,
        strengths: ["Strong experience", "Clear structure"],
        improvements: ["Add more metrics", "Refine summary"]
      },
      premium_feedback: {
        professional_level: "Senior Level",
        detailed_suggestions: ["Quantify achievements"],
        rewrites: ["Improved bullet points"],
        portfolio_tips: ["Add GitHub link"],
        keywords: ["Leadership", "Architecture"]
      }
    };
    this.resumeService.setLatestAnalysis(mockAnalysis);
    this.router.navigate(['/home/analysis']);
  }

  goToUpload() {
    this.router.navigate(['/home']);
  }

  goBack() {
    this.location.back(); // Navigates to the previous page in history
  }
}
