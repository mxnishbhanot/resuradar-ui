import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.scss']
})
export class Pricing {
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
        'Everything in Pro',
        // 'Multi-seat licensing',
        // 'Admin dashboard',
        // 'Usage analytics',
        // 'Dedicated support'
      ]
    }
  ];

  constructor(private router: Router) { }

  selectPlan(plan: any) {
    if (plan.type === 'free') {
      // Redirect to upload
      window.location.href = '/upload';
      this.router.navigate(['/upload']);
    } else if (plan.type === 'pro') {
      // Open Stripe checkout or upgrade modal
      alert('Redirecting to secure checkout...');
      // In real app: this.stripeService.redirectToCheckout();
    }
  }
}
