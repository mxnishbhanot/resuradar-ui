import { Component, effect, inject, signal } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';

@Component({
  selector: 'rr-summary',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    CdkTextareaAutosize
],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {

  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  form: FormGroup = this.fb.group({
    summary: ['', [Validators.required, Validators.maxLength(500)]]
  });

  // SIGNAL-BASED STATE
  summaryText = signal('');
  showForm     = signal(false);

  constructor() {
    // Auto-sync service → UI state
    effect(() => {
      const personal = this.store.state().personal;
      const summary = personal?.summary ?? '';

      this.summaryText.set(summary);

      // Patch form without triggering form changes
      this.form.patchValue({ summary }, { emitEvent: false });
    });
  }

  showEditForm(): void {
    this.showForm.set(true);
    this.form.patchValue({ summary: this.summaryText() });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.form.patchValue({ summary: this.summaryText() });
  }

  saveSummary(): void {
    if (this.form.invalid) return;

    const newSummary = this.form.value.summary;

    this.store.update({
      personal: {
        ...this.store.state().personal,
        summary: newSummary
      }
    });

    this.summaryText.set(newSummary);
    this.showForm.set(false);
  }
}
