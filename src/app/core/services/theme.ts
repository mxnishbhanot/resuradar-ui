import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  // Reactive theme signal
  theme = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    // Reactive auto-apply — runs whenever theme() changes
    effect(() => {
      const current = this.theme();
      this.applyThemeClass(current);
      localStorage.setItem('theme', current);
    });
  }

  // Determine initial theme
  private getInitialTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;

    // System preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  // Applies class to document body
  private applyThemeClass(mode: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;

    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${mode}-theme`);
  }

  // Toggle theme mode
  toggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
  }

  // Explicit setter (optional)
  setTheme(mode: 'light' | 'dark') {
    this.theme.set(mode);
  }
}
