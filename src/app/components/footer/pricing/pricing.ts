import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing {
  private userService = inject(UserService);
  user: any = null;

  plans = [
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
      name: 'Pro',
      type: 'pro',
      price: '$7.99',
      cycle: 'quarterly',
      highlight: false,
      comingSoon: true,
      features: [
        'Everything in Pro'
      ]
    }
  ];

  constructor(private router: Router) {
    // Subscribe to user state
    this.userService.user$.subscribe(user => {
      this.user = user;
    });
  }

  get isPro(): boolean {
    return this.user?.isPremium === true;
  }

  selectPlan(plan: any) {
    if (plan.type === 'free') {
      this.router.navigate(['/upload']);
    } else if (plan.type === 'pro' && !this.isPro) {
      // Only allow upgrade if not already Pro
      alert('Redirecting to secure checkout...');
      // TODO: integrate payment flow
    }
    // If already Pro, do nothing (button won't appear)
  }
}
