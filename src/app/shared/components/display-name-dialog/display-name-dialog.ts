import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface DisplayNameDialogData {
  initialName: string;
}

@Component({
  selector: 'rr-display-name-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './display-name-dialog.html',
  styleUrl: './display-name-dialog.scss',
})
export class DisplayNameDialogComponent {
  readonly ctrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(120)],
  });

  constructor(
    readonly dialogRef: MatDialogRef<DisplayNameDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) data: DisplayNameDialogData
  ) {
    this.ctrl.setValue(data.initialName ?? '');
  }

  submit(): void {
    if (this.ctrl.invalid) return;
    this.dialogRef.close(this.ctrl.value.trim());
  }
}
