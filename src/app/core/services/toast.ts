import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Reactive toast list (replaces BehaviorSubject)
  toasts = signal<Toast[]>([]);

  show(
    type: Toast['type'],
    title: string,
    message: string,
    duration: number = 5000
  ) {
    const id = String(Date.now());
    const newToast: Toast = { id, type, title, message, duration };

    // Add toast to the end of the list
    this.toasts.update((list) => [...list, newToast]);

    // Auto remove when duration expires
    setTimeout(() => this.remove(id), duration);
  }

  remove(id: string) {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
