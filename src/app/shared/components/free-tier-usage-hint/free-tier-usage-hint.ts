import { Component, computed, inject, input } from '@angular/core';

import { UserService } from '../../../core/services/user';

@Component({
  selector: 'app-free-tier-usage-hint',
  standalone: true,
  templateUrl: './free-tier-usage-hint.html',
  styleUrls: ['./free-tier-usage-hint.scss'],
})
export class FreeTierUsageHint {
  private userService = inject(UserService);

  readonly variant = input.required<'standard' | 'jd'>();

  readonly visible = computed(() => {
    const u = this.userService.user();
    if (!u || u.isPremium === true) {
      return false;
    }
    const lim =
      this.variant() === 'standard' ? u.standardLimit : u.jdLimit;
    return typeof lim === 'number' && lim > 0 && Number.isFinite(lim);
  });

  readonly line = computed(() => {
    if (!this.visible()) {
      return '';
    }
    const u = this.userService.user()!;
    const v = this.variant();
    if (v === 'standard') {
      const used = u.standardUsed ?? 0;
      const limit = u.standardLimit!;
      const remaining = Math.max(0, limit - used);
      return `${remaining} of ${limit} attempts remaining`;
    }
    const used = u.jdUsed ?? 0;
    const limit = u.jdLimit!;
    const remaining = Math.max(0, limit - used);
    return `${remaining} of ${limit} job match attempts remaining`;
  });
}
