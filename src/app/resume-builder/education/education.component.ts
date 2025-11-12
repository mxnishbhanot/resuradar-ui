import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Education } from '../../shared/models/resume-builder.model';

@Component({
  selector: 'rr-education',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule
  ],
  template: `
    <div class="rr-education">
      <div class="rr-section-header">
        <h2 class="rr-section-title">Education</h2>
        <p class="rr-section-subtitle">Add your educational background</p>
      </div>

      <div class="rr-education__list" *ngIf="educations.length > 0">
        <mat-card *ngFor="let edu of educations; let i = index" class="rr-education-card">
          <mat-card-content>
            <div class="rr-education-card__header">
              <div class="rr-education-card__info">
                <h3 class="rr-education-card__school">{{ edu.school }}</h3>
                <p class="rr-education-card__degree">{{ edu.degree }}</p>
                <div class="rr-education-card__meta">
                  <span *ngIf="edu.field" class="rr-badge">{{ edu.field }}</span>
                  <span class="rr-education-card__years">
                    {{ edu.startYear }} - {{ edu.endYear || 'Present' }}
                  </span>
                </div>
                <p class="rr-education-card__description" *ngIf="edu.description">
                  {{ edu.description }}
                </p>
              </div>
              <div class="rr-education-card__actions">
                <button mat-icon-button (click)="editEducation(i)" color="primary">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteEducation(i)" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="rr-empty-state" *ngIf="educations.length === 0 && !showForm">
        <mat-icon class="rr-empty-icon">school</mat-icon>
        <h3>No education added yet</h3>
        <p>Add your degrees, certifications, and courses</p>
      </div>

      <form [formGroup]="form" class="rr-education__form" *ngIf="showForm">
        <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
          <mat-label>School / University</mat-label>
          <input matInput formControlName="school" placeholder="Harvard University" />
          <mat-icon matPrefix>school</mat-icon>
          <mat-error *ngIf="form.get('school')?.hasError('required')">
            School name is required
          </mat-error>
        </mat-form-field>

        <div class="rr-form-row">
          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Degree</mat-label>
            <input matInput formControlName="degree" placeholder="Bachelor of Science" />
            <mat-icon matPrefix>military_tech</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Field of Study</mat-label>
            <input matInput formControlName="field" placeholder="Computer Science" />
            <mat-icon matPrefix>library_books</mat-icon>
          </mat-form-field>
        </div>

        <div class="rr-form-row">
          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Start Year</mat-label>
            <input matInput formControlName="startYear" placeholder="2018" maxlength="4" />
            <mat-icon matPrefix>event</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>End Year</mat-label>
            <input matInput formControlName="endYear" placeholder="2022" maxlength="4"
                   [disabled]="form.get('isCurrent')?.value" />
            <mat-icon matPrefix>event</mat-icon>
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="isCurrent" class="rr-checkbox">
          Currently studying here
        </mat-checkbox>

        <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
          <mat-label>Description (Optional)</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Relevant coursework, achievements, GPA, honors..."></textarea>
        </mat-form-field>

        <div class="rr-form-actions">
          <button mat-stroked-button type="button" (click)="cancelForm()">
            Cancel
          </button>
          <button mat-flat-button color="primary" (click)="saveEducation()"
                  [disabled]="form.invalid">
            <mat-icon>{{ editingIndex !== null ? 'save' : 'add' }}</mat-icon>
            {{ editingIndex !== null ? 'Update' : 'Add' }} Education
          </button>
        </div>
      </form>

      <button mat-flat-button color="primary" class="rr-add-button"
              *ngIf="!showForm" (click)="showAddForm()">
        <mat-icon>add</mat-icon>
        Add Education
      </button>
    </div>
  `,
  styleUrl: './education.component.scss',
})
export class EducationComponent implements OnInit {
  form: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  educations: Education[] = [];

  constructor(
    private fb: FormBuilder,
    private store: ResumeBuilderService
  ) {
    this.form = this.fb.group({
      school: ['', Validators.required],
      degree: [''],
      field: [''],
      startYear: [''],
      endYear: [''],
      isCurrent: [false],
      description: ['']
    });

    // Disable endYear when isCurrent is checked
    this.form.get('isCurrent')?.valueChanges.subscribe(isCurrent => {
      if (isCurrent) {
        this.form.get('endYear')?.setValue('');
      }
    });
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.educations = state.educations || [];
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
  }

  editEducation(index: number): void {
    this.editingIndex = index;
    const edu = this.educations[index];
    this.form.patchValue({
      school: edu.school,
      degree: edu.degree,
      field: edu.field,
      startYear: edu.startYear,
      endYear: edu.endYear,
      isCurrent: !edu.endYear,
      description: edu.description
    });
    this.showForm = true;
  }

  saveEducation(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const education: Education = {
      id: this.editingIndex !== null ? this.educations[this.editingIndex].id : Date.now().toString(),
      school: formValue.school,
      degree: formValue.degree,
      field: formValue.field,
      startYear: formValue.startYear,
      endYear: formValue.isCurrent ? '' : formValue.endYear,
      description: formValue.description
    };

    let updatedEducations: Education[];
    if (this.editingIndex !== null) {
      updatedEducations = [...this.educations];
      updatedEducations[this.editingIndex] = education;
    } else {
      updatedEducations = [...this.educations, education];
    }

    this.store.replace({
      ...this.store.snapshot,
      educations: updatedEducations
    });

    this.cancelForm();
  }

  deleteEducation(index: number): void {
    const updatedEducations = this.educations.filter((_, i) => i !== index);
    this.store.replace({
      ...this.store.snapshot,
      educations: updatedEducations
    });
  }
}
