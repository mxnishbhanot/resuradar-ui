import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
    CommonModule,
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
export class SummaryComponent implements OnInit {
  form!: FormGroup;
  showForm = false;
  summaryText = '';
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  constructor() {
    this.form = this.fb.group({
      summary: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.summaryText = state.personal.summary || '';
      // Update the form value when the store state changes
      this.form.patchValue({ summary: this.summaryText });
    });
  }

  showEditForm(): void {
    this.showForm = true;
    this.form.patchValue({ summary: this.summaryText });
  }

  cancelForm(): void {
    this.showForm = false;
    this.form.patchValue({ summary: this.summaryText }); // Revert to saved value
  }

  saveSummary(): void {
    if (this.form.invalid) return;

    const summaryValue = this.form.get('summary')?.value;
    this.store.update({ personal: { summary: summaryValue } });
    this.summaryText = summaryValue;
    this.showForm = false;
  }
}
