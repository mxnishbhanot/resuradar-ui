// skeleton.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SkeletonService {
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  // Simulates initial app load
  setLoading(isLoading: boolean) {
    this.loadingSubject.next(isLoading);
  }

  // Simulate content load with minimum display time for smooth UX
  simulateLoad(minDuration: number = 800) {
    this.setLoading(true);
    setTimeout(() => {
      this.setLoading(false);
    }, minDuration);
  }
}
