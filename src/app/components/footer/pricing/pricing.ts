import { Component, computed, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user';
import { UpgradePro } from '../../upgrade-pro/upgrade-pro';

interface PricingPlan {
  name: string;
  type: 'free' | 'pro';
  price: string;
  cycle?: string;
  highlight: boolean;
  comingSoon: boolean;
  features: string[];
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing {
  private router = inject(Router);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  user = this.userService.user;

  isPro = computed(() => this.user()?.isPremium === true);

  plans: PricingPlan[] = [
    {
      name: 'Free',
      type: 'free',
      price: '₹0',
      cycle: 'No card required',
      highlight: false,
      comingSoon: false,
      features: [
        'Up to 3 resume analyses',
        'Resume builder: 3 templates (Modern, Corporate, Technical)',
        '1 free job description match',
        'Value-first onboarding',
        'PDF uploads for analysis'
      ]
    },
    {
      name: 'Pro',
      type: 'pro',
      price: '₹499',
      cycle: 'per month + GST',
      highlight: true,
      comingSoon: false,
      features: [
        'Unlimited resume analyses & JD matching',
        'All 5 resume templates + premium PDF export (2 extra vs Free)',
        'Full premium AI insights on every run',
        'UPI mandate subscription via PhonePe',
        'Cancel per PhonePe / dashboard rules'
      ]
    }
  ];

  private getFullScreenDialogConfig(): MatDialogConfig {
    return {
      panelClass: 'responsive-dialog-wrapper',
      maxWidth: '100vw',
      width: '100%',
      height: '100%',
      disableClose: true
    };
  }

  selectPlan(plan: PricingPlan) {
    if (plan.type === 'free') {
      this.router.navigate(['/upload']);
      return;
    }

    if (plan.type === 'pro' && !this.isPro()) {
      this.dialog.open(UpgradePro, this.getFullScreenDialogConfig());
    }
  }
}
