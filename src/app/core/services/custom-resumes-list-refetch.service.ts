import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * Tracks app-wide NavigationEnd so My Resumes can refetch when re-entering
 * `/custom-list` from another route without relying on component-local state
 * (new CustomResumesComponent instances reset their own fields).
 */
@Injectable({ providedIn: 'root' })
export class CustomResumesListRefetchService {
  private router = inject(Router);

  /** Emits when navigation lands on My Resumes from a non-list URL. */
  readonly reenteredList = new Subject<void>();

  private previousUrl = '';

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = e.urlAfterRedirects;
        if (
          url.includes('/custom-list') &&
          this.previousUrl !== '' &&
          !this.previousUrl.includes('/custom-list')
        ) {
          this.reenteredList.next();
        }
        this.previousUrl = url;
      });
  }
}
