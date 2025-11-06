import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
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

  openUpgradeModal() {
    if (!this.isPro) {
      this.dialog.open(UpgradePro, {
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        panelClass: 'upgrade-pro-dialog',
        hasBackdrop: true,
        disableClose: false,
      });
    }
  }
}
