import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';

@Component({
  selector: 'rr-personal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss']
})
export class PersonalComponent {

  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  /** UI state signals */
  isSaving = signal(false);
  showSaved = signal(false);

  /** Build the form */
  form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(/^\+?[1-9]\d{1,14}$/)],
    headline: [''],
    location: [''],
    linkedin: [''],
    github: ['']
  });

  /** Local throttling timer */
  private saveTimer: any = null;

  constructor() {
    /** Load current state into form (ONE-WAY injection) */
    effect(() => {
      const personal = this.store.state().personal;
      this.form.patchValue(personal ?? {}, { emitEvent: false });
    });

    /** Auto-save with SIGNAL EFFECT (replaces RxJS valueChanges) */
    effect(() => {
      const formValue = this.form.value;

      if (this.form.invalid) return;

      // debounce 700ms
      if (this.saveTimer) clearTimeout(this.saveTimer);

      this.saveTimer = setTimeout(() => {
        this.save(formValue);
      }, 700);
    });
  }

  /** Perform save to signal-based service */
  private save(values: any): void {
    this.isSaving.set(true);
    this.showSaved.set(false);

    setTimeout(() => {
      this.store.update({
        personal: { ...this.store.snapshot.personal, ...values }
      });

      this.isSaving.set(false);
      this.showSaved.set(true);

      setTimeout(() => this.showSaved.set(false), 2500);
    }, 500);
  }
}
