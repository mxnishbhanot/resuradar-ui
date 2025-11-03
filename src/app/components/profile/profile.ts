import { UserProfile } from './../../core/services/user';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../core/services/user';
import { Router } from '@angular/router';
import { GoogleAuthService } from '../../core/services/google-auth';
@Component({
  selector: 'app-profile',
  imports: [CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  user = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    picture: 'https://i.pravatar.cc/150?img=12', // Replace with Google profile pic URL
    resumeCount: 7,
    lastActive: new Date(),
    joinedDate: new Date(),
    isPremium: false
  };
  constructor(private userService: UserService, private router: Router, private googleAuth: GoogleAuthService) { }

  ngOnInit() {
    this.userService.fetchCurrentUser().subscribe();
    this.userService.user$.subscribe(user => {
      console.log(user);

      if (user) {
        this.user = {
          name: user.name,
          email: user.email,
          picture: user.picture,
          isPremium: user.isPremium,
          joinedDate: new Date(user?.joinedDate) ?? '',
          resumeCount: user.resumeCount || 0,
          lastActive: new Date(),
        };
        console.log(this.user);

      }
    });
  }

  get userInitials(): string {
    return this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  signOut() {
    // Implement your Google Sign-Out logic here
    console.log('Signing out...');
    // e.g., this.authService.signOut();
  }

  downloadData() {
    alert('Data export will be available soon.');
  }

  navigate() {
    // Implement navigation to resume history page
    console.log('Navigating to resume history...');
    this.router.navigate(['/home/history']);
  }

  logout() {
    this.googleAuth.logout();
    this.router.navigate(['/home/upload']);
  }
}
