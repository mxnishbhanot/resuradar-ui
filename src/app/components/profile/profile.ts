import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserService } from '../../core/services/user';
import { GoogleAuthService } from '../../core/services/google-auth';
import { ThemeService } from '../../core/services/theme';

import { Subscription } from 'rxjs';

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
export class Profile implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  // --- Signals ---
  user = signal<any>({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    picture: 'https://i.pravatar.cc/150?img=12',
    resumeCount: 7,
    lastActive: new Date(),
    joinedDate: new Date(),
    isPremium: false,
  });

  isDarkTheme = signal<boolean>(false);

  // Derived signal: initials
  userInitials = computed(() => {
    const n = this.user()?.name || '';
    return n
      .split(' ')
      .map((x: string) => x[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private googleAuth: GoogleAuthService,
    private themeService: ThemeService
  ) {
    // Initialize theme
    this.isDarkTheme.set(localStorage.getItem('theme') === 'dark');
  }

  ngOnInit(): void {
    // Fetch user from backend
    const sub1 = this.userService.fetchCurrentUser().subscribe();

    // Sync userService.user$ → signal
    const sub2 = this.userService.user$.subscribe(u => {
      if (u) {
        this.user.set({
          name: u.name,
          email: u.email,
          picture: u.picture,
          isPremium: u.isPremium,
          joinedDate: new Date(u?.joinedDate) ?? new Date(),
          resumeCount: u.resumeCount || 0,
          lastActive: new Date(),
        });
      }
    });

    this.subs.push(sub1, sub2);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => {
      try { s.unsubscribe(); } catch {}
    });
  }

  toggleTheme(): void {
    this.themeService.toggle();
    this.isDarkTheme.set(localStorage.getItem('theme') === 'dark');
  }

  navigate(): void {
    this.router.navigate(['/custom-list']);
  }

  logout(): void {
    this.googleAuth.logout();
    this.router.navigate(['/upload']);
  }
}
