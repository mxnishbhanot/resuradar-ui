import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResumeService } from '../../core/services/resume';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-analysis-result',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './analysis-result.html',
  styleUrls: ['./analysis-result.scss']
})
export class AnalysisResult implements OnInit {
  @Input() isProUser = false;
  data: any = null;

  // For the circular progress bar
  private radius = 54;
  circumference = 2 * Math.PI * this.radius;

  constructor(
    private resumeService: ResumeService,
    private router: Router,
    private userService: UserService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.data = this.resumeService.getLatestAnalysis();

    if (!this.data) {
      this.router.navigate(['/upload']);
    }

    this.userService.fetchCurrentUser().subscribe();
    this.userService.user$.subscribe(user => {
      this.isProUser = user?.isPremium || false;
    })
  }

  get strokeDashoffset(): number {
    if (!this.data) return this.circumference;
    const score = this.data.score;
    const progress = score / 100;
    return this.circumference * (1 - progress);
  }

  getScoreClass(): string {
    if (this.data.score >= 80) return 'score-excellent';
    if (this.data.score >= 60) return 'score-good';
    return 'score-needs-work';
  }

  getScoreLabel(): string {
    if (this.data.score >= 80) return 'Excellent';
    if (this.data.score >= 60) return 'Good';
    return 'Needs Improvement';
  }

  getScoreDescription(): string {
    if (this.data.score >= 80) return 'Outstanding resume with strong impact and effectiveness';
    if (this.data.score >= 60) return 'Good resume with potential for improvement in key areas';
    return 'Resume needs significant improvements to stand out to employers';
  }

  openUpgradeModal() {
    this.dialog.open(UpgradePro, {
      width: '100%',
      maxWidth: '520px',
      maxHeight: '90vh',
      panelClass: 'upgrade-pro-dialog',
      hasBackdrop: true,
      disableClose: false,
    });
  }
}
