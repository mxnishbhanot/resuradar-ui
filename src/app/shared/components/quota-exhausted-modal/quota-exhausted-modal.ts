import { Component, Inject, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-quota-exhausted-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './quota-exhausted-modal.html',
  styleUrls: ['./quota-exhausted-modal.scss']
})
export class QuotaExhaustedModal {

  // SIGNAL STATES
  isMobile = signal(window.innerWidth < 768);
  isClosing = signal(false);

  private dialogRef = inject(MatDialogRef<QuotaExhaustedModal>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}

  // Auto-update mobile state on resize
  resize$ = fromEvent(window, 'resize');

  ngOnInit() {
    effect(() => {
      this.resize$.subscribe(() => {
        this.isMobile.set(window.innerWidth < 768);
      });
    });
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
