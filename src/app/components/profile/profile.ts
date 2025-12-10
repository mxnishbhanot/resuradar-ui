import { Component, OnInit, effect, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserService } from '../../core/services/user';
import { GoogleAuthService } from '../../core/services/google-auth';
import { ThemeService } from '../../core/services/theme';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class Profile {

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // SSR-safe default theme
  isDarkTheme = signal<boolean>(
    this.isBrowser ? localStorage.getItem('theme') === 'dark' : false
  );

  // User state
  user = signal({
    name: 'Loading...',
    email: '',
    picture: '',
    resumeCount: 0,
    joinedDate: new Date(),
    isPremium: false
  });

  // Derived signal
  userInitials = computed(() => {
    const name = this.user()?.name || '';
    return name
      .split(' ')
      .map(n => n[0] ?? '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });

  constructor(
    private userService: UserService,
    private router: Router,
    public googleAuth: GoogleAuthService,
    private themeService: ThemeService
  ) {

    // Sync userService.user → local user signal
    effect(() => {
      const u = this.userService.user();
      if (u) {
        this.user.set({
          name: u.name,
          email: u.email,
          picture: u.picture,
          isPremium: u.isPremium,
          resumeCount: u.resumeCount || 0,
          joinedDate: new Date(u.joinedDate),
        });
      }
    });

    // Load backend user
    this.userService.fetchCurrentUser().subscribe();
  }

  toggleTheme() {
    this.themeService.toggle();

    if (this.isBrowser) {
      this.isDarkTheme.set(localStorage.getItem('theme') === 'dark');
    }
  }

  navigate() {
    this.router.navigate(['/custom-list']);
  }

  logout() {
    this.googleAuth.logout();
    this.router.navigate(['/upload']);
  }
}
