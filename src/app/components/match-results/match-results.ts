import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
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
  data: any = null;
  isProUser = false;

  constructor(
    private resumeService: ResumeService,
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.data = this.resumeService.getLatestMatchAnalysis();
    if (!this.data) {
      this.router.navigate(['/scan']);
      return;
    }

    this.userService.user$.subscribe(user => {
      this.isProUser = user?.isPremium || false;
    });
  }

  getScoreClass(): string {
    const score = this.data.match_score;
    if (score >= 80) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'weak';
  }

  openUpgradeModal() {
    this.dialog.open(UpgradePro, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'upgrade-pro-dialog'
    });
  }
}
