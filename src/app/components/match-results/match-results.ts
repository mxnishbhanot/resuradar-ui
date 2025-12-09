import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { ResumeService } from '../../core/services/resume';
import { UserService } from '../../core/services/user';
import { Router } from '@angular/router';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';

@Component({
  selector: 'app-match-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './match-results.html',
  styleUrls: ['./match-results.scss']
})
export class MatchResults implements OnInit {

  // Services via inject()
  private resumeService = inject(ResumeService);
  private userService = inject(UserService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Reactive analysis result
  data = signal<any>(null);

  // User from updated UserService (signal)
  user = this.userService.user;

  // Premium state
  isProUser = computed(() => !!this.user()?.isPremium);

  // Circle geometry
  private radius = 54;
  circumference = 2 * Math.PI * this.radius;

  // Reactive stroke animation
  strokeDashoffset = computed(() => {
    const score = this.data()?.free_feedback?.match_score ?? 0;
    return this.circumference * (1 - score / 100);
  });

  // Score class
  scoreClass = computed(() => {
    const s = this.data()?.free_feedback?.match_score ?? 0;
    if (s >= 80) return 'strong';
    if (s >= 60) return 'good';
    if (s >= 40) return 'fair';
    return 'weak';
  });

  // Score description
  scoreDescription = computed(() => {
    const s = this.data()?.free_feedback?.match_score ?? 0;
    if (s >= 80) return 'Excellent match with strong alignment';
    if (s >= 60) return 'Good match with some areas for improvement';
    if (s >= 40) return 'Fair match with significant improvements needed';
    return 'Weak match requiring major changes';
  });

  ngOnInit(): void {
    const result = this.resumeService.getLatestMatchAnalysis();

    if (!result) {
      this.router.navigate(['/scan']);
      return;
    }

    // Store in signal
    this.data.set(result);

    // Optional: refresh user, signal auto-updates
    this.userService.fetchCurrentUser().subscribe();
  }

  // UI helpers
  getScoreClass() { return this.scoreClass(); }
  getScoreDescription() { return this.scoreDescription(); }

  openUpgradeModal(): void {
    const config: MatDialogConfig = {
      panelClass: 'responsive-dialog-wrapper',
      maxWidth: '100vw',
      width: '100%',
      height: '100%',
      disableClose: true
    };
    this.dialog.open(UpgradePro, config);
  }
}
