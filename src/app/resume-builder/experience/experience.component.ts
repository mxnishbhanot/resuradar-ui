import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Experience } from '../../shared/models/resume-builder.model';

@Component({
  selector: 'rr-experience',
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
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="rr-experience">
      <div class="rr-section-header">
        <h2 class="rr-section-title">Work Experience</h2>
        <p class="rr-section-subtitle">Showcase your professional journey</p>
      </div>

      <div class="rr-experience__list" *ngIf="experiences.length > 0">
        <mat-card *ngFor="let exp of experiences; let i = index" class="rr-experience-card">
          <mat-card-content>
            <div class="rr-experience-card__header">
              <div class="rr-experience-card__info">
                <h3 class="rr-experience-card__title">{{ exp.title }}</h3>
                <p class="rr-experience-card__company">{{ exp.company }}</p>
                <div class="rr-experience-card__meta">
                  <mat-icon class="rr-meta-icon">event</mat-icon>
                  <span>{{ exp.startDate }} - {{ exp.isCurrent ? 'Present' : exp.endDate }}</span>
                </div>
                <ul class="rr-experience-card__bullets" *ngIf="exp.bullets && exp.bullets.length > 0">
                  <li *ngFor="let bullet of exp.bullets">{{ bullet }}</li>
                </ul>
              </div>
              <div class="rr-experience-card__actions">
                <button mat-icon-button (click)="editExperience(i)" color="primary">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteExperience(i)" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="rr-empty-state" *ngIf="experiences.length === 0 && !showForm">
        <mat-icon class="rr-empty-icon">work</mat-icon>
        <h3>No experience added yet</h3>
        <p>Add your professional work history and achievements</p>
      </div>

      <form [formGroup]="form" class="rr-experience__form" *ngIf="showForm">
        <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
          <mat-label>Job Title</mat-label>
          <input matInput formControlName="title" placeholder="Senior Software Engineer" />
          <mat-icon matPrefix>badge</mat-icon>
          <mat-error *ngIf="form.get('title')?.hasError('required')">
            Job title is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
          <mat-label>Company</mat-label>
          <input matInput formControlName="company" placeholder="Tech Corp Inc." />
          <mat-icon matPrefix>business</mat-icon>
        </mat-form-field>

        <div class="rr-form-row">
          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>Start Date</mat-label>
            <input matInput formControlName="startDate" placeholder="Jan 2020" />
            <mat-icon matPrefix>event</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="rr-form-field">
            <mat-label>End Date</mat-label>
            <input matInput formControlName="endDate" placeholder="Dec 2023"
                   [disabled]="form.get('isCurrent')?.value" />
            <mat-icon matPrefix>event</mat-icon>
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="isCurrent" class="rr-checkbox">
          I currently work here
        </mat-checkbox>

        <div class="rr-bullets-section">
          <div class="rr-bullets-header">
            <label class="rr-bullets-label">Key Achievements & Responsibilities</label>
            <button mat-stroked-button color="accent" type="button"
                    (click)="generateBulletsWithAI()" [disabled]="isGenerating"
                    class="rr-ai-button">
              <mat-icon *ngIf="!isGenerating">auto_awesome</mat-icon>
              <mat-spinner *ngIf="isGenerating" diameter="20"></mat-spinner>
              Generate with AI
            </button>
          </div>

          <div formArrayName="bullets" class="rr-bullets-list">
            <div *ngFor="let bullet of bullets.controls; let i = index"
                 class="rr-bullet-item">
              <mat-form-field appearance="outline" class="rr-bullet-field">
                <textarea matInput [formControlName]="i" rows="2"
                          placeholder="Describe your achievement or responsibility..."></textarea>
              </mat-form-field>
              <button mat-icon-button type="button" (click)="removeBullet(i)"
                      color="warn" class="rr-bullet-remove">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <button mat-stroked-button type="button" (click)="addBullet()"
                  class="rr-add-bullet-button">
            <mat-icon>add</mat-icon>
            Add Bullet Point
          </button>
        </div>

        <div class="rr-form-actions">
          <button mat-stroked-button type="button" (click)="cancelForm()">
            Cancel
          </button>
          <button mat-flat-button color="primary" (click)="saveExperience()"
                  [disabled]="form.invalid">
            <mat-icon>{{ editingIndex !== null ? 'save' : 'add' }}</mat-icon>
            {{ editingIndex !== null ? 'Update' : 'Add' }} Experience
          </button>
        </div>
      </form>

      <button mat-flat-button color="primary" class="rr-add-button"
              *ngIf="!showForm" (click)="showAddForm()">
        <mat-icon>add</mat-icon>
        Add Experience
      </button>
    </div>
  `,
  styleUrl: './experience.component.scss',
})
export class ExperienceComponent implements OnInit {
  form: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  experiences: Experience[] = [];
  isGenerating = false;

  constructor(
    private fb: FormBuilder,
    private store: ResumeBuilderService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      company: [''],
      startDate: [''],
      endDate: [''],
      isCurrent: [false],
      bullets: this.fb.array([])
    });

    // Disable endDate when isCurrent is checked
    this.form.get('isCurrent')?.valueChanges.subscribe(isCurrent => {
      if (isCurrent) {
        this.form.get('endDate')?.setValue('');
      }
    });
  }

  get bullets(): FormArray {
    return this.form.get('bullets') as FormArray;
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.experiences = state.experiences || [];
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.addBullet();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
  }

  addBullet(): void {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number): void {
    this.bullets.removeAt(index);
  }

  editExperience(index: number): void {
    this.editingIndex = index;
    const exp = this.experiences[index];

    this.bullets.clear();
    if (exp.bullets && exp.bullets.length > 0) {
      exp.bullets.forEach(bullet => {
        this.bullets.push(this.fb.control(bullet));
      });
    } else {
      this.addBullet();
    }

    this.form.patchValue({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: exp.isCurrent
    });
    this.showForm = true;
  }

  saveExperience(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const bulletValues = formValue.bullets.filter((b: string) => b && b.trim());

    const experience: Experience = {
      id: this.editingIndex !== null ? this.experiences[this.editingIndex].id : Date.now().toString(),
      title: formValue.title,
      company: formValue.company,
      startDate: formValue.startDate,
      endDate: formValue.isCurrent ? '' : formValue.endDate,
      isCurrent: formValue.isCurrent,
      bullets: bulletValues
    };

    let updatedExperiences: Experience[];
    if (this.editingIndex !== null) {
      updatedExperiences = [...this.experiences];
      updatedExperiences[this.editingIndex] = experience;
    } else {
      updatedExperiences = [...this.experiences, experience];
    }

    this.store.replace({
      ...this.store.snapshot,
      experiences: updatedExperiences
    });

    this.cancelForm();
  }

  deleteExperience(index: number): void {
    const updatedExperiences = this.experiences.filter((_, i) => i !== index);
    this.store.replace({
      ...this.store.snapshot,
      experiences: updatedExperiences
    });
  }

  generateBulletsWithAI(): void {
    const title = this.form.get('title')?.value;
    const company = this.form.get('company')?.value;

    if (!title) {
      return;
    }

    this.isGenerating = true;
    const ctx = {
      personal: this.store.snapshot.personal,
      title,
      company
    };

    this.store.generateWithAI('experience', ctx).subscribe({
      next: (res: any) => {
        this.isGenerating = false;
        if (res?.bullets && Array.isArray(res.bullets)) {
          this.bullets.clear();
          res.bullets.forEach((bullet: string) => {
            this.bullets.push(this.fb.control(bullet));
          });
        }
      },
      error: () => {
        this.isGenerating = false;
      }
    });
  }
}
