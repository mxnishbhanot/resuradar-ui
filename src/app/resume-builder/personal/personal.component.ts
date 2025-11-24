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
  template: `
<div class="personal-wrapper">
  <div class="section-header">
    <div class="header-content">
      <h2 class="section-title">Personal Information</h2>
      <p class="section-description">Add your contact details and professional identity</p>
    </div>

    <div class="save-indicator" [class.saving]="isSaving" [class.saved]="showSaved">
      <mat-spinner *ngIf="isSaving" diameter="18"></mat-spinner>
      <mat-icon *ngIf="showSaved">check_circle</mat-icon>
      <span *ngIf="isSaving">Saving...</span>
      <span *ngIf="showSaved">Saved</span>
    </div>
  </div>

  <form [formGroup]="form" class="modern-form">

    <!-- Name Fields -->
    <div class="form-row">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>First Name</mat-label>
        <input matInput formControlName="firstName" placeholder="Jane" />
        <mat-icon matPrefix>person</mat-icon>
        <mat-error *ngIf="form.get('firstName')?.hasError('required')">
          First name is required
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Last Name</mat-label>
        <input matInput formControlName="lastName" placeholder="Doe" />
        <mat-icon matPrefix>person</mat-icon>
        <mat-error *ngIf="form.get('lastName')?.hasError('required')">
          Last name is required
        </mat-error>
      </mat-form-field>
    </div>

    <!-- Headline -->
    <mat-form-field appearance="outline" class="form-field full-width">
      <mat-label>Professional Headline</mat-label>
      <input matInput formControlName="headline" placeholder="Senior Software Engineer" />
      <mat-icon matPrefix>badge</mat-icon>
      <mat-hint>A brief professional title or tagline</mat-hint>
    </mat-form-field>

    <!-- Contact Fields -->
    <div class="form-row">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Email Address</mat-label>
        <input matInput formControlName="email" type="email" placeholder="jane@example.com" />
        <mat-icon matPrefix>email</mat-icon>
        <mat-error *ngIf="form.get('email')?.hasError('email')">
          Enter a valid email address
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Phone Number</mat-label>
        <input matInput formControlName="phone" type="tel" placeholder="+1 (555) 000-0000" />
        <mat-icon matPrefix>phone</mat-icon>
      </mat-form-field>
    </div>

    <!-- Location -->
    <mat-form-field appearance="outline" class="form-field full-width">
      <mat-label>Location</mat-label>
      <input matInput formControlName="location" placeholder="San Francisco, CA" />
      <mat-icon matPrefix>location_on</mat-icon>
      <mat-hint>City, State or City, Country</mat-hint>
    </mat-form-field>

    <!-- Social Links -->
    <div class="form-section">
      <h3 class="subsection-title">Social & Portfolio Links</h3>

      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>LinkedIn Profile</mat-label>
          <input matInput formControlName="linkedin" placeholder="linkedin.com/in/username" />
          <mat-icon matPrefix>link</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>GitHub Profile</mat-label>
          <input matInput formControlName="github" placeholder="github.com/username" />
          <mat-icon matPrefix>code</mat-icon>
        </mat-form-field>
      </div>
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
    const personal = this.store.snapshot.personal || {};

    this.form = this.fb.group({
      firstName: [personal.firstName || '', Validators.required],
      lastName: [personal.lastName || '', Validators.required],
      email: [personal.email || '', [Validators.email]],
      phone: [personal.phone || ''],
      headline: [personal.headline || ''],
      location: [personal.location || ''],
      linkedin: [personal.linkedin || ''],
      github: [personal.github || '']
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
