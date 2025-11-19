import { Component, OnInit } from '@angular/core';
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
  data: any = null;
  isProUser = false;

  // For the circular progress bar
  private radius = 54;
  circumference = 2 * Math.PI * this.radius;

  constructor(
    private resumeService: ResumeService,
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog
  ) { }

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

  get strokeDashoffset(): number {
    if (!this.data) return this.circumference;
    const score = this.data.free_feedback.match_score;
    const progress = score / 100;
    return this.circumference * (1 - progress);
  }

  getScoreClass(): string {
    const score = this.data.free_feedback.match_score;
    if (score >= 80) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'weak';
  }

  getScoreDescription(): string {
    const score = this.data.free_feedback.match_score;
    if (score >= 80) return 'Excellent match with strong alignment';
    if (score >= 60) return 'Good match with some areas for improvement';
    if (score >= 40) return 'Fair match with significant improvements needed';
    return 'Weak match requiring major changes';
  }

  openUpgradeModal(): void {
    const dialogConfig: MatDialogConfig = {
      width: '100%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'upgrade-modal-container',
      autoFocus: false,
      restoreFocus: true,
      disableClose: false, // Allow closing by clicking outside
      hasBackdrop: true,
      backdropClass: 'upgrade-modal-backdrop',
      data: {
        userName: 'John Doe',
        userEmail: 'john@example.com'
      },
      // Smooth entrance animation
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '250ms'
    };

    const dialogRef = this.dialog.open(UpgradePro, dialogConfig);

    // Handle modal close
    dialogRef.afterClosed().subscribe(result => {
      console.log('Modal closed with result:', result);
      // Handle any post-close logic
    });
  }
}
