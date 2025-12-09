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
import { toSignal } from '@angular/core/rxjs-interop';

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

  // Reactive signals
  data = signal<any>(null);

  // Convert user$ observable to a signal (Angular best-practice)
  user = toSignal(this.userService.user$, { initialValue: null });

  // Is user Pro?
  isProUser = computed(() => {
    const u = this.user();
    return !!u?.isPremium;
  });

  // Circle math signals
  private radius = 54;
  circumference = 2 * Math.PI * this.radius;

  // Stroke offset computed from score
  strokeDashoffset = computed(() => {
    const d = this.data();
    if (!d) return this.circumference;

    const score = d.free_feedback.match_score ?? 0;
    return this.circumference * (1 - score / 100);
  });

  // Score class (UI indicator)
  scoreClass = computed(() => {
    const score = this.data()?.free_feedback?.match_score ?? 0;
    if (score >= 80) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'weak';
  });

  // Score description
  scoreDescription = computed(() => {
    const score = this.data()?.free_feedback?.match_score ?? 0;
    if (score >= 80) return 'Excellent match with strong alignment';
    if (score >= 60) return 'Good match with some areas for improvement';
    if (score >= 40) return 'Fair match with significant improvements needed';
    return 'Weak match requiring major changes';
  });

  ngOnInit(): void {
    const result = this.resumeService.getLatestMatchAnalysis();
    if (!result) {
      this.router.navigate(['/scan']);
      return;
    }
    this.data.set(result);
  }

  // UI wrapper functions (optional, for clarity)
  getScoreClass(): string {
    return this.scoreClass();
  }

  getScoreDescription(): string {
    return this.scoreDescription();
  }

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
