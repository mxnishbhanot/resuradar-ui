import { Component, effect, inject, signal } from '@angular/core';

import {
  FormBuilder,
  FormControl,
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
import { InlineResumeFormatHintComponent } from '../../shared/components/inline-resume-format-hint/inline-resume-format-hint.component';
import { SelectionColorApplyComponent } from '../../shared/components/selection-color-apply/selection-color-apply.component';
import { FormatResumeInlinePipe } from '../../shared/pipes/format-resume-inline.pipe';

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
    CdkTextareaAutosize,
    InlineResumeFormatHintComponent,
    SelectionColorApplyComponent,
    FormatResumeInlinePipe,
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

  get summaryFc(): FormControl<string> {
    return this.form.get('summary') as FormControl<string>;
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
