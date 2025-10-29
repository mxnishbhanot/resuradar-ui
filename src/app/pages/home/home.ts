import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from "@angular/material/tooltip";
import { GoogleAuthService } from '../../core/services/google-auth';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../core/services/user';
import { ScAngularLoader } from 'sc-angular-loader';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatCardModule,
    RouterOutlet,
    MatTooltipModule,
    ScAngularLoader
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  analysisData: any = null;
  userName = 'Sarah Johnson';
  userInitials = 'SJ';
  avatar = 'https://i.pravatar.cc/150?img=12';
  userResumeCount = 3;
  userScore = 7.2;
  activeTab = 'home';
  user: any;

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

  constructor(
    private router: Router,
    public googleAuth: GoogleAuthService,
    public dialog: MatDialog,
    private userService: UserService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.googleAuth.initialize('159597214381-oa813em96pornk6kmb6uaos2vnk2o02g.apps.googleusercontent.com');
    }, 500);

    this.googleAuth.loadUserFromStorage();
    this.googleAuth.user$.subscribe((u) => {
      this.userName = u ? u.name : 'Guest';
      this.avatar = u ? u.picture : 'https://i.pravatar.cc/150?img=12';
    });

    this.userService.fetchCurrentUser().subscribe();

    this.userService.user$.subscribe(user => {
      console.log(user);
      this.user = user;
    });
  }

  onAnalysisComplete(data: any) {
    console.log('Analysis complete:', data);
    this.analysisData = data;

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

  navigate(navigateTo: string) {
    this.activeTab = navigateTo;
    this.router.navigate([`/home/${navigateTo}`]);
  }

  loginWithGoogle() {
    this.googleAuth.signIn();
  }

  openUpgradeModal() {
    this.dialog.open(UpgradePro, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'upgrade-pro-dialog'
    });
  }
}
