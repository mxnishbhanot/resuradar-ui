import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

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
export class AnalysisResult {
  @Input() data: any;
  @Input() isProUser = false;

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
}
