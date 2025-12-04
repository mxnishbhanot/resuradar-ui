import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TextFieldModule } from '@angular/cdk/text-field';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'rr-personal',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.scss',
})
export class PersonalComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isSaving = false;
  showSaved = false;
  private destroy$ = new Subject<void>();
  private saveTimeout: any;
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  constructor() {
    const personal = this.store.snapshot.personal || {};
    this.form = this.fb.group({
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
