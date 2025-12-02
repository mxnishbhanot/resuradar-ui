import { ToastContainerComponent } from './shared/components/toast-container/toast-container';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('resume-analyzer-frontend');
  constructor(private _theme: ThemeService) {}
}
