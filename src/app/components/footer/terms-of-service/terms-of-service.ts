import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, RouterModule],
  templateUrl: './terms-of-service.html',
  styleUrls: ['./terms-of-service.scss']
})
export class TermsOfService {
  currentYear = new Date().getFullYear();
}
