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

  constructor(private resumeService: ResumeService, private router: Router, private userService: UserService, public dialog: MatDialog) { }

  ngOnInit() {
    this.data = this.resumeService.getLatestAnalysis();

    if (!this.data) {
      this.router.navigate(['/home/upload']);
    }

    this.userService.fetchCurrentUser().subscribe();
    this.userService.user$.subscribe(user => {
      this.isProUser = user?.isPremium || false;
    })
  }

  getScoreClass(): string {
    if (this.data.score >= 8) return 'score-excellent';
    if (this.data.score >= 6) return 'score-good';
    return 'score-needs-work';
  }

  getScoreLabel(): string {
    if (this.data.score >= 8) return 'Excellent';
    if (this.data.score >= 6) return 'Good';
    return 'Needs Improvement';
  }

  getScorePercentage(): number {
    return (this.data.score / 10) * 100;
  }

    openUpgradeModal() {
      this.dialog.open(UpgradePro, {
        width: '100%',
        maxWidth: '520px',
        panelClass: 'upgrade-pro-dialog'
      });
    }
}
