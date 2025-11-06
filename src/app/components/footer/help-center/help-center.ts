import { Component, inject } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help-center',
  imports: [MatExpansionModule],
  templateUrl: './help-center.html',
  styleUrl: './help-center.scss',
})
export class HelpCenter {
  private router = inject(Router);

  navigate() {
    this.router.navigate(['/contact'])
  }
}
