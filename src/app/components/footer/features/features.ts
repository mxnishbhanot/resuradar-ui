import { Component, computed, inject } from '@angular/core';
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
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './features.html',
  styleUrl: './features.scss'
})
export class Features {

  /** Static UI values */
  freeLimit = 3;
  premiumPrice = '$10';
  ctaRoute = '/upload';

  /** Signals */
  private userService = inject(UserService);
  user = this.userService.user; // <-- signal<UserProfile | null>

  /** computed() instead of get isPro() */
  isPro = computed(() => this.user()?.isPremium === true);

  private dialog = inject(MatDialog);

  openUpgradeModal() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.panelClass = 'responsive-dialog-wrapper';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.width = '100%';
    dialogConfig.height = '100%';
    dialogConfig.disableClose = true;

    this.dialog.open(UpgradePro, dialogConfig);
  }
}
