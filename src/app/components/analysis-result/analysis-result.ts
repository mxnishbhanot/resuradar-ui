import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

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

  // Modern DI
  private resumeService = inject(ResumeService);
  private router = inject(Router);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  // Reactive analysis data
  data = signal<any>(null);

  // User from UserService (already a signal)
  user = this.userService.user;

  // Premium reactive state
  isProUser = computed(() => !!this.user()?.isPremium);

  // Circle progress geometry
  private radius = 54;
  circumference = 2 * Math.PI * this.radius;

  // Reactive circle animation
  strokeDashoffset = computed(() => {
    const s = this.data()?.score ?? 0;
    return this.circumference * (1 - s / 100);
  });

  // Score Class
  scoreClass = computed(() => {
    const s = this.data()?.score ?? 0;
    if (s >= 80) return 'score-excellent';
    if (s >= 60) return 'score-good';
    return 'score-needs-work';
  });

  // Score labels
  scoreLabel = computed(() => {
    const s = this.data()?.score ?? 0;
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    return 'Needs Improvement';
  });

  scoreDescription = computed(() => {
    const s = this.data()?.score ?? 0;
    if (s >= 80) return 'Outstanding resume with strong impact and effectiveness';
    if (s >= 60) return 'Good resume with potential for improvement in key areas';
    return 'Resume needs significant improvements to stand out to employers';
  });

  ngOnInit(): void {
    const result = this.resumeService.getLatestAnalysis();

    if (!result) {
      this.router.navigate(['/upload']);
      return;
    }

    this.data.set(result);

    // Fetch user silently → updates signal
    this.userService.fetchCurrentUser().subscribe();
  }

  // Template-friendly accessors
  getScoreClass() { return this.scoreClass(); }
  getScoreLabel() { return this.scoreLabel(); }
  getScoreDescription() { return this.scoreDescription(); }

  openUpgradeModal() {
    const config: MatDialogConfig = {
      panelClass: 'responsive-dialog-wrapper',
      maxWidth: '100vw',
      width: '100%',
      height: '100%',
      disableClose: true,
    };

    this.dialog.open(UpgradePro, config);
  }
}
