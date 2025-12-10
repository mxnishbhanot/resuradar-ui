import { ToastContainerComponent } from './shared/components/toast-container/toast-container';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme';
import { Meta, Title } from '@angular/platform-browser';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('resume-analyzer-frontend');
  constructor(private _theme: ThemeService, private meta: Meta, private title2: Title) {
    this.title2.setTitle('ResuRadar - AI Resume Builder');
    this.meta.addTags([
      { name: 'description', content: 'Free AI-powered resume builder and analyzer. Score your resume and match it with job descriptions.' },
      { name: 'robots', content: 'index, follow' }
    ]);
  }
}
