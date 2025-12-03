import { Component, Inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-quota-exhausted-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './quota-exhausted-modal.html',
  styleUrls: ['./quota-exhausted-modal.scss']
})
export class QuotaExhaustedModal implements OnInit {
  isMobile: boolean = false;
  isClosing: boolean = false; // For exit animation

  constructor(
    public dialogRef: MatDialogRef<QuotaExhaustedModal>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    // Breakpoint at 768px (Standard Tablet/Mobile cutoff)
    this.isMobile = window.innerWidth < 768;
  }

  upgrade() {
    // 1. Trigger exit animation
    this.isClosing = true;
    // 2. Wait for animation then close with result
    setTimeout(() => {
      this.dialogRef.close('upgrade');
    }, 300);
  }

  close() {
    this.isClosing = true;
    setTimeout(() => {
      this.dialogRef.close();
    }, 300);
  }
}
