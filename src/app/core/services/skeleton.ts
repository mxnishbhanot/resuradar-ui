import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SkeletonService {

  // Signal replaces BehaviorSubject
  loading = signal<boolean>(true);

  // Update loading state
  setLoading(isLoading: boolean): void {
    this.loading.set(isLoading);
  }

  // Simulate initial loading animation with a minimum duration
  simulateLoad(minDuration: number = 800): void {
    this.setLoading(true);

    setTimeout(() => {
      this.setLoading(false);
    }, minDuration);
  }
}
