import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatProgressBarModule,
    MatTooltipModule,
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

  showPremiumInsights = computed(
    () => !!this.user()?.isPremium || !!this.data()?.premium_feedback
  );

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

  /** When the API summary is substantive, hide redundant band copy under the score. */
  matchSummaryText = computed(() => {
    const s = this.data()?.free_feedback?.summary;
    return typeof s === 'string' && s.trim() ? s.trim() : '';
  });

  /** Shown only for short/legacy summaries so we do not duplicate the Match Summary card. */
  scoreDescription = computed(() => {
    if (this.matchSummaryText().length > 50) return '';
    const s = this.data()?.free_feedback?.match_score ?? 0;
    if (s >= 80) return 'Strong alignment on many JD signals.';
    if (s >= 60) return 'Solid fit with clear gaps to close vs this JD.';
    if (s >= 40) return 'Partial fit—prioritize the gaps list against this posting.';
    return 'Large misalignment—treat the JD as the checklist for edits.';
  });

  /** Premium rewrites: structured pairs, or legacy shapes from older stored analyses. */
  jobMatchRewrites = computed(() => {
    const raw = this.data()?.premium_feedback?.suggested_rewrites;
    if (!Array.isArray(raw)) return [];
    const out: { original: string; suggestion: string }[] = [];
    for (const rw of raw) {
      if (rw && typeof rw === 'object') {
        const original = typeof (rw as { original?: string }).original === 'string'
          ? String((rw as { original: string }).original).trim()
          : '';
        const suggestion = typeof (rw as { suggestion?: string }).suggestion === 'string'
          ? String((rw as { suggestion: string }).suggestion).trim()
          : '';
        if (original || suggestion) out.push({ original, suggestion });
        continue;
      }
      if (typeof rw === 'string') {
        const t = rw.trim();
        if (t) out.push({ original: '', suggestion: t });
      }
    }
    return out;
  });

  matchRecommendations = computed(() => {
    const raw = this.data()?.premium_feedback?.recommendations;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((r: unknown) => (typeof r === 'string' ? r.trim() : ''))
      .filter(Boolean);
  });

  matchScoreAriaLabel = computed(() => {
    const s = this.data()?.free_feedback?.match_score ?? 0;
    return `Match score ${s} out of 100`;
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
