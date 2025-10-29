import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
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
export class Profile {
  user = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    picture: 'https://i.pravatar.cc/150?img=12', // Replace with Google profile pic URL
    joinDate: new Date('2023-03-15'),
    resumeCount: 7,
    avgScore: 7.8,
    lastActive: new Date()
  };

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
}
