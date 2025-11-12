import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    MatIconModule
  ],
  template: `
    <div class="rr-personal">
      <div class="rr-section-header">
        <h2 class="rr-section-title">Personal Information</h2>
        <p class="rr-section-subtitle">Tell us about yourself</p>
      </div>

      <form [formGroup]="form" class="rr-personal__form">
        <div class="rr-form-row">
          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" placeholder="John" />
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="form.get('firstName')?.hasError('required')">
              First name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" placeholder="Doe" />
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="form.get('lastName')?.hasError('required')">
              Last name is required
            </mat-error>
          </mat-form-field>
        </div>

        <div class="rr-form-row">
          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="john.doe@email.com" />
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" placeholder="+1 (555) 123-4567" />
            <mat-icon matPrefix>phone</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
          <mat-label>Professional Headline</mat-label>
          <input matInput formControlName="headline" placeholder="Senior Software Engineer | Full-Stack Developer" />
          <mat-icon matPrefix>work</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
          <mat-label>Location</mat-label>
          <input matInput formControlName="location" placeholder="San Francisco, CA" />
          <mat-icon matPrefix>location_on</mat-icon>
        </mat-form-field>

        <div class="rr-form-row">
          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>LinkedIn Profile</mat-label>
            <input matInput formControlName="linkedin" placeholder="linkedin.com/in/johndoe" />
            <mat-icon matPrefix>link</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>GitHub Profile</mat-label>
            <input matInput formControlName="github" placeholder="github.com/johndoe" />
            <mat-icon matPrefix>code</mat-icon>
          </mat-form-field>
        </div>

        <div class="rr-save-indicator" *ngIf="isSaving">
          <mat-icon class="rr-save-icon">cloud_upload</mat-icon>
          <span>Saving changes...</span>
        </div>

        <div class="rr-save-indicator rr-save-indicator--success" *ngIf="showSaved">
          <mat-icon class="rr-save-icon">check_circle</mat-icon>
          <span>All changes saved</span>
        </div>
      </form>
    </div>
  `,
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
    this.form = this.fb.group({
      firstName: [this.store.snapshot.personal.firstName, Validators.required],
      lastName: [this.store.snapshot.personal.lastName, Validators.required],
      email: [this.store.snapshot.personal.email, [Validators.email]],
      phone: [this.store.snapshot.personal.phone],
      headline: [this.store.snapshot.personal.headline],
      location: [this.store.snapshot.personal.location],
      linkedin: [this.store.snapshot.personal.linkedin],
      github: [this.store.snapshot.personal.github]
    });
  }

  ngOnInit(): void {
    // Auto-save on form changes with debounce
    this.form.valueChanges
      .pipe(
        debounceTime(800),
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

    // Simulate save delay and update store
    setTimeout(() => {
      this.store.update({
        personal: { ...this.store.snapshot.personal, ...values }
      });

      this.isSaving = false;
      this.showSaved = true;

      // Hide saved indicator after 2 seconds
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        this.showSaved = false;
      }, 2000);
    }, 500);
  }
}
