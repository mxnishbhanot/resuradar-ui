import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type DeleteResumeConfirmData =
  | { mode: 'builder'; resumeTitle: string }
  | { mode: 'analysis'; kindLabel: string };

@Component({
  selector: 'rr-delete-history-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './delete-history-confirm-dialog.html',
  styleUrl: './delete-history-confirm-dialog.scss',
})
export class DeleteHistoryConfirmDialogComponent {
  constructor(
    readonly dialogRef: MatDialogRef<DeleteHistoryConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteResumeConfirmData
  ) {}
}
