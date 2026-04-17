import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DisplayNameDialogData {
  initialName: string;
}

@Component({
  selector: 'rr-display-name-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Display name</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Name</mat-label>
        <input matInput [formControl]="ctrl" maxlength="120" />
      </mat-form-field>
      <p class="hint">Leave empty to show the original file name.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button (click)="dialogRef.close()">Cancel</button>
      <button type="button" mat-flat-button color="primary" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .full { width: 100%; margin-top: 8px; }
    .hint { font-size: 0.85rem; opacity: 0.75; margin: 0 0 8px; }
  `,
})
export class DisplayNameDialogComponent {
  readonly ctrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(120)],
  });

  constructor(
    readonly dialogRef: MatDialogRef<DisplayNameDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) data: DisplayNameDialogData
  ) {
    this.ctrl.setValue(data.initialName ?? '');
  }

  submit(): void {
    if (this.ctrl.invalid) return;
    this.dialogRef.close(this.ctrl.value.trim());
  }
}
