import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface CustomSnackBarData {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

@Component({
  selector: 'app-custom-snackbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.scss'
})
export class CustomSnackbarComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: CustomSnackBarData,
    private snackBarRef: MatSnackBarRef<CustomSnackbarComponent>
  ) {}

  close(): void {
    this.snackBarRef.dismiss();
  }

  get icon(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}
