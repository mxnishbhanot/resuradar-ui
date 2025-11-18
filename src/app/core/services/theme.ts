import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // 'light' | 'dark'
  theme = signal<'light' | 'dark'>(this._initialTheme());

  constructor() {
    this.apply(this.theme());
  }

  private _initialTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    // respect system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  apply(mode: 'light' | 'dark') {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${mode}-theme`);
    localStorage.setItem('theme', mode);
    this.theme.set(mode);
  }

  toggle() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.apply(next);
  }
}
