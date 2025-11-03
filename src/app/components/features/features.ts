import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';
import { MatDialog } from '@angular/material/dialog';

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

  constructor(private dialog: MatDialog) {}

  openUpgradeModal() {
    this.dialog.open(UpgradePro, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'upgrade-pro-dialog'
    });
  }
}
