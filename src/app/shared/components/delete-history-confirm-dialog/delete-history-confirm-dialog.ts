import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DeleteHistoryConfirmData {
  kindLabel: string;
}

@Component({
  selector: 'rr-delete-history-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete this analysis?</h2>
    <mat-dialog-content>
      <p>
        This removes the saved {{ data.kindLabel }} from your dashboard. Your free trial usage is not
        reset.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button type="button" mat-flat-button color="warn" (click)="dialogRef.close(true)">Delete</button>
    </mat-dialog-actions>
  `,
})
export class DeleteHistoryConfirmDialogComponent {
  constructor(
    readonly dialogRef: MatDialogRef<DeleteHistoryConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteHistoryConfirmData
  ) {}
}
