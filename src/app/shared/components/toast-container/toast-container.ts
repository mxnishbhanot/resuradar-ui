import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastService, Toast } from '../../../core/services/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
  // Optional: animate with Angular animations (or use CSS)
  // animations: [toastAnimation]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);

  // Direct signal access — no async pipe needed!
  toasts = this.toastService.toasts.asReadonly();

  getIcon(type: Toast['type']): string {
    return {
      success: 'check_circle',
      error: 'error_outline',
      warning: 'warning_amber',
      info: 'info_outline',
    }[type] || 'info_outline';
  }

  remove(id: string) {
    this.toastService.remove(id);
  }
}
