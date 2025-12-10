import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.html',
  styleUrls: ['./skeleton-loader.scss']
})
export class SkeletonLoader {
  // Signal Input
  isMobile = input<boolean>(false);
}
