import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
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
import { toSignal } from '@angular/core/rxjs-interop';

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

  // Services via modern injection
  private resumeService = inject(ResumeService);
  private router = inject(Router);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  // Data as reactive signal
  data = signal<any>(null);

  // User premium state (auto-updating signal)
  user = toSignal(this.userService.user$, { initialValue: null });

  // Exposed to template
  isProUser = computed(() => !!this.user()?.isPremium);

  // Circle geometry
  private radius = 54;
  circumference = 2 * Math.PI * this.radius;

  // Reactive circular progress offset
  strokeDashoffset = computed(() => {
    const score = this.data()?.score ?? 0;
    return this.circumference * (1 - score / 100);
  });

  // Score class
  scoreClass = computed(() => {
    const score = this.data()?.score ?? 0;
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-needs-work';
  });

  // Score label text
  scoreLabel = computed(() => {
    const score = this.data()?.score ?? 0;
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  });

  // Score description text
  scoreDescription = computed(() => {
    const score = this.data()?.score ?? 0;
    if (score >= 80) return 'Outstanding resume with strong impact and effectiveness';
    if (score >= 60) return 'Good resume with potential for improvement in key areas';
    return 'Resume needs significant improvements to stand out to employers';
  });

  ngOnInit(): void {
    const result = this.resumeService.getLatestAnalysis();

    if (!result) {
      this.router.navigate(['/upload']);
      return;
    }

    this.data.set(result);

    // Trigger background user fetch (signals update automatically)
    this.userService.fetchCurrentUser().subscribe();
  }

  // Template wrappers (optional for readability)
  getScoreClass() { return this.scoreClass(); }
  getScoreLabel() { return this.scoreLabel(); }
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
