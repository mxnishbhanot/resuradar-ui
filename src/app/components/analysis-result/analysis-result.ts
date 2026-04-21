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

  /** Premium sections: subscribed user, or server included premium_feedback (e.g. wow analysis). */
  showPremiumInsights = computed(
    () => !!this.user()?.isPremium || !!this.data()?.premium_feedback
  );

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

  scoreAriaLabel = computed(() => {
    const s = this.data()?.score ?? 0;
    return `Score ${s} out of 100`;
  });

  scoreExplanation = computed(() => {
    const s = this.data()?.free_feedback?.score_explanation;
    return typeof s === 'string' && s.trim() ? s.trim() : '';
  });

  /** Shown only when API omits score_explanation (legacy); avoids duplicating or contradicting the model. */
  scoreDescription = computed(() => {
    const expl = this.scoreExplanation();
    if (expl) return '';
    const s = this.data()?.score ?? 0;
    if (s >= 80) return 'Strong overall presentation with clear strengths.';
    if (s >= 60) return 'Solid base with room to sharpen impact and clarity.';
    return 'Focus on clarity, proof, and structure so employers see your value quickly.';
  });

  scoreFactors = computed(() => {
    const raw = this.data()?.free_feedback?.score_factors;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (f: { name?: string; note?: string; impact?: string }) =>
          f && typeof f.name === 'string' && typeof f.note === 'string'
      )
      .map((f: { name: string; note: string; impact?: string }) => ({
        name: f.name.trim(),
        note: f.note.trim(),
        impact: ['high', 'medium', 'low'].includes(String(f.impact).toLowerCase())
          ? String(f.impact).toLowerCase()
          : 'medium',
      }))
      .filter((f) => f.name && f.note);
  });

  /** Premium rewrites: structured pairs, or legacy string[] from older stored analyses. */
  resumeRewrites = computed(() => {
    const raw = this.data()?.premium_feedback?.rewrites;
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

  keywordChips = computed(() => {
    const raw = this.data()?.premium_feedback?.keywords;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((k: unknown) => (typeof k === 'string' ? k.trim() : ''))
      .filter(Boolean);
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
