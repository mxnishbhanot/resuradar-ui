import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  imports: [ MatIcon, MatCardModule, CommonModule, MatButtonModule, RouterModule ],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {

}
