import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent, CustomSnackBarData } from '../../shared/components/snackbar/snackbar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  open(message: string, type: CustomSnackBarData['type'] = 'info') {
    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: { message, type },
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar-panel']
    });
  }

  success(message: string) { this.open(message, 'success'); }
  error(message: string) { this.open(message, 'error'); }
  info(message: string) { this.open(message, 'info'); }
  warning(message: string) { this.open(message, 'warning'); }
}
