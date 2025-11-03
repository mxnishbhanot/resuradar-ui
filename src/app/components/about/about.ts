import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [MatIconModule, MatCardModule, RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {

}
