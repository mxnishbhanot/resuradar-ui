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


  openUpgradeModal() {
    const dialogConfig = new MatDialogConfig();

    // This connects to the global CSS above
    dialogConfig.panelClass = 'responsive-dialog-wrapper';

    dialogConfig.maxWidth = '100vw';
    dialogConfig.width = '100%';
    dialogConfig.height = '100%';
    dialogConfig.disableClose = true; // We handle closing manually

    this.dialog.open(UpgradePro, dialogConfig);
  }
}
