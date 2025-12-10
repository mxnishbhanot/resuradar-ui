import { Component, Inject, signal, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-quota-exhausted-modal',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './quota-exhausted-modal.html',
  styleUrls: ['./quota-exhausted-modal.scss']
})
export class QuotaExhaustedModal implements OnInit, OnDestroy {

  private platformId = inject(PLATFORM_ID);
  private dialogRef = inject(MatDialogRef<QuotaExhaustedModal>);

  /** SSR-safe: initialize with static value when not in browser */
  isMobile = signal(false);
  isClosing = signal(false);

  private resizeSub?: Subscription;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser()) {
      // Initial value
      this.isMobile.set(window.innerWidth < 768);

      // Listen safely to resize
      this.resizeSub = fromEvent(window, 'resize').subscribe(() => {
        this.isMobile.set(window.innerWidth < 768);
      });
    }
  }

  ngOnDestroy() {
    this.resizeSub?.unsubscribe();
  }

  upgrade() {
    this.isClosing.set(true);
    setTimeout(() => this.dialogRef.close('upgrade'), 300);
  }

  close() {
    this.isClosing.set(true);
    setTimeout(() => this.dialogRef.close(), 300);
  }
}
