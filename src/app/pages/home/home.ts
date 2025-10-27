
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { UploadResume } from '../../components/upload-resume/upload-resume';
import { AnalysisResult } from '../../components/analysis-result/analysis-result';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    UploadResume,
    AnalysisResult,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatCardModule
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  analysisData: any = null;
  isLoggedIn = true; // For demo purposes
  userName = 'Sarah Johnson';
  userInitials = 'SJ';
  userResumeCount = 3;
  userScore = 7.2;
  activeTab = 'home';

  // Mock data for previous resumes
  previousResumes = [
    {
      id: 1,
      name: 'Senior_Developer_Resume.pdf',
      date: '2024-01-15',
      score: 7.8,
      position: 'Senior Full Stack Developer'
    },
    {
      id: 2,
      name: 'Tech_Lead_Resume_v2.pdf',
      date: '2024-01-08',
      score: 6.5,
      position: 'Technical Lead'
    },
    {
      id: 3,
      name: 'Updated_Portfolio_Resume.pdf',
      date: '2024-01-01',
      score: 8.2,
      position: 'Software Architect'
    }
  ];

  onAnalysisComplete(data: any) {
    console.log('Analysis complete:', data);
    this.analysisData = data;

    // Scroll to results after analysis
    setTimeout(() => {
      const resultsElement = document.querySelector('.analysis-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }

  onNewAnalysis() {
    this.analysisData = null;
  }

  loadPreviousResume(resume: any) {
    // In a real app, this would load the actual resume data
    console.log('Loading previous resume:', resume);
    this.analysisData = {
      score: resume.score,
      free_feedback: {
        strengths: [
          "Strong technical foundation with proven experience",
          "Excellent project leadership capabilities",
          "Consistent career progression"
        ],
        improvements: [
          "Could benefit from more quantifiable achievements",
          "Consider adding more specific metrics",
          "Expand on recent accomplishments"
        ],
        summary: `Previously analyzed resume for ${resume.position} position. Overall strong candidate with room for specific improvements.`
      },
      premium_feedback: {
        professional_level: "Senior Level",
        detailed_suggestions: [
          "Add specific metrics to quantify achievements",
          "Highlight recent project successes",
          "Optimize for target position keywords"
        ],
        rewrites: [
          "Led multiple successful project deliveries with positive client feedback",
          "Mentored junior developers and improved team productivity",
          "Implemented best practices that enhanced code quality"
        ],
        portfolio_tips: [
          "Update GitHub with latest projects",
          "Add case studies for major accomplishments",
          "Include client testimonials if available"
        ],
        keywords: [
          "Technical Leadership",
          "Project Management",
          "Team Mentoring",
          "Best Practices"
        ]
      }
    };
  }

  getScoreClass(score: number): string {
    if (score >= 8) return 'score-excellent';
    if (score >= 6) return 'score-good';
    return 'score-needs-work';
  }

  getScoreLabel(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Needs Work';
  }
}
