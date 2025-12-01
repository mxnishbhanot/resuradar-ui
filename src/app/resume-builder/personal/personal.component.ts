import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'rr-personal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.scss',
})
export class PersonalComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isSaving = false;
  showSaved = false;
  private destroy$ = new Subject<void>();
  private saveTimeout: any;

  constructor(
    private fb: FormBuilder,
    private store: ResumeBuilderService
  ) {
    const personal = this.store.snapshot.personal || {};

    this.form = this.fb.group({  // CHANGED: Added summary to form
      firstName: [personal.firstName || '', Validators.required],
      lastName: [personal.lastName || '', Validators.required],
      email: [personal.email || '', [Validators.email]],
      phone: [personal.phone || ''],
      headline: [personal.headline || ''],
      location: [personal.location || ''],
      linkedin: [personal.linkedin || ''],
      github: [personal.github || ''],
    });
  }

  ngOnInit(): void {
    // Auto-save on form changes with debounce
    this.form.valueChanges
      .pipe(
        debounceTime(1000),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe((values) => {
        this.save(values);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private save(values: any): void {
    if (this.form.invalid) {
      return;
    }

    this.isSaving = true;
    this.showSaved = false;

    // Simulate network delay for UX
    setTimeout(() => {
      // CHANGED: Include summary in update
      this.store.update({
        personal: { ...this.store.snapshot.personal, ...values }
      });

      this.isSaving = false;
      this.showSaved = true;

      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      this.saveTimeout = setTimeout(() => {
        this.showSaved = false;
      }, 3000);
    }, 600);
  }
}
