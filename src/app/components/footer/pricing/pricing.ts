import { Component, computed, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user';

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

  /** The user signal from updated service */
  user = this.userService.user; // <-- this is a signal<UserProfile | null>

  /** Computed signal for Pro status */
  isPro = computed(() => this.user()?.isPremium === true);

  plans: PricingPlan[] = [
    {
      name: 'Free',
      type: 'free',
      price: '$0',
      cycle: 'forever',
      highlight: false,
      comingSoon: false,
      features: [
        '3 free resume analyses',
        'ATS Score (0–10)',
        'Executive Summary',
        'AI Strengths & Improvements',
        'PDF uploads only'
      ]
    },
    {
      name: 'Pro',
      type: 'pro',
      price: '$10',
      cycle: 'lifetime',
      highlight: true,
      comingSoon: false,
      features: [
        'Unlimited resume uploads',
        'All Free features, plus:',
        'Job Description Matching',
        'Professional Level detection',
        'Rewritten bullet examples',
        'ATS keyword optimization',
        'Portfolio enhancement tips',
        'Priority support'
      ]
    },
    {
      name: 'Pro (Quarterly)',
      type: 'pro',
      price: '$7.99',
      cycle: 'quarterly',
      highlight: false,
      comingSoon: true,
      features: ['Everything in Pro']
    }
  ];

  /** Called when clicking Free or Pro buttons */
  selectPlan(plan: PricingPlan) {
    if (plan.type === 'free') {
      this.router.navigate(['/upload']);
      return;
    }

    if (plan.type === 'pro' && !this.isPro()) {
      alert('Redirecting to secure checkout...');
      // TODO: integrate payment
    }
  }
}
