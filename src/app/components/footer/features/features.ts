import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UpgradePro } from '../../upgrade-pro/upgrade-pro';
import { UserService } from '../../../core/services/user';

@Component({
  selector: 'app-features',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './features.html',
  styleUrl: './features.scss',
})
export class Features {
  freeLimit = 3;
  premiumPrice = '$10';
  ctaRoute = '/upload';

  // Inject user service
  private userService = inject(UserService);
  user: any = null;

  constructor(private dialog: MatDialog) {
    // Subscribe to user state
    this.userService.user$.subscribe(user => {
      this.user = user;
    });
  }

  get isPro(): boolean {
    return this.user?.isPremium === true;
  }


  openUpgradeModal(): void {
    if (!this.isPro) {
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
}
