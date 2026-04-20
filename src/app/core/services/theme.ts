import { Injectable, signal, effect, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private platformId = inject(PLATFORM_ID);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // SSR-safe default value
  theme = signal<'light' | 'dark'>('light');

  /** Applied to `mat-datepicker` in dark mode so overlay calendar picks up `.custom-dark-datepicker` styles. */
  readonly datepickerPanelClass = computed<string | string[]>(() =>
    this.theme() === 'dark' ? 'custom-dark-datepicker' : ''
  );

  constructor() {
    if (this.isBrowser()) {
      // Load initial theme from storage or system preference
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        this.theme.set(stored);
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        this.theme.set(prefersDark ? 'dark' : 'light');
      }

      // Effect applies theme only in browser
      effect(() => {
        const current = this.theme();
        this.applyThemeClass(current);
        localStorage.setItem('theme', current);
      });
    }
  }

  /** Apply CSS class to document body (browser only) */
  private applyThemeClass(mode: 'light' | 'dark'): void {
    if (!this.isBrowser()) return;

    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${mode}-theme`);
  }

  /** Toggle between light/dark */
  toggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
  }

  /** Explicit setter */
  setTheme(mode: 'light' | 'dark') {
    this.theme.set(mode);
  }
}
