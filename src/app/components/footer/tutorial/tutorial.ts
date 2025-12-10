
import { Component } from '@angular/core';
import { SafeUrlPipe } from '../../../shared/utils/safe-url-pipe';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-tutorial',
  imports: [SafeUrlPipe, MatCard],
  templateUrl: './tutorial.html',
  styleUrl: './tutorial.scss',
})
export class Tutorial {
 videoUrl = 'https://www.youtube.com/embed/YOUR_VIDEO_ID';
}
