import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';

@Component({
  selector: 'rr-summary',
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="rr-summary">
      <div class="rr-section-header">
        <h2 class="rr-section-title">Professional Summary</h2>
        <p class="rr-section-subtitle">Create a compelling overview of your experience</p>
      </div>

      <div class="rr-summary__content">
        <mat-card class="rr-summary-card" *ngIf="summary && !isEditing">
          <mat-card-content>
            <div class="rr-summary-card__header">
              <div class="rr-summary-card__icon">
                <mat-icon>description</mat-icon>
              </div>
              <div class="rr-summary-card__actions">
                <button mat-icon-button (click)="editSummary()" color="primary">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteSummary()" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
            <p class="rr-summary-card__text">{{ summary }}</p>
          </mat-card-content>
        </mat-card>

        <div class="rr-empty-state" *ngIf="!summary && !isEditing">
          <mat-icon class="rr-empty-icon">summarize</mat-icon>
          <h3>No summary yet</h3>
          <p>A strong professional summary can make your resume stand out</p>
          <div class="rr-empty-state__actions">
            <button mat-flat-button color="primary" (click)="startManualEdit()">
              <mat-icon>edit</mat-icon>
              Write Summary
            </button>
            <button mat-stroked-button color="accent" (click)="generateWithAI()"
                    [disabled]="isGenerating">
              <mat-icon>auto_awesome</mat-icon>
              Generate with AI
            </button>
          </div>
        </div>

        <form [formGroup]="form" class="rr-summary-form" *ngIf="isEditing">
          <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
            <mat-label>Professional Summary</mat-label>
            <textarea matInput formControlName="summary" rows="8"
                      placeholder="Write a compelling summary that highlights your key strengths, experience, and career goals..."></textarea>
            <mat-hint>{{ form.get('summary')?.value?.length || 0 }} / 500 characters</mat-hint>
          </mat-form-field>

          <div class="rr-summary-tips">
            <h4 class="rr-tips-title">
              <mat-icon>lightbulb</mat-icon>
              Writing Tips
            </h4>
            <ul class="rr-tips-list">
              <li>Start with your current role or strongest qualification</li>
              <li>Highlight 2-3 key achievements with quantifiable results</li>
              <li>Mention your career goals or what you're looking for</li>
              <li>Keep it concise - aim for 3-5 sentences (250-400 characters)</li>
            </ul>
          </div>

          <div class="rr-form-actions">
            <button mat-stroked-button type="button" (click)="cancelEdit()">
              Cancel
            </button>
            <button mat-stroked-button color="accent" type="button"
                    (click)="generateWithAI()" [disabled]="isGenerating">
              <mat-spinner *ngIf="isGenerating" diameter="20" class="rr-spinner"></mat-spinner>
              <mat-icon *ngIf="!isGenerating">auto_awesome</mat-icon>
              {{ isGenerating ? 'Generating...' : 'Generate with AI' }}
            </button>
            <button mat-flat-button color="primary" (click)="saveSummary()">
              <mat-icon>save</mat-icon>
              Save Summary
            </button>
          </div>
        </form>

        <!-- Resume Review Section -->
        <div class="rr-review-section" *ngIf="summary && !isEditing">
          <h3 class="rr-review-title">Resume Review</h3>

          <div class="rr-review-stats">
            <div class="rr-stat-card">
              <mat-icon class="rr-stat-icon rr-stat-icon--info">person</mat-icon>
              <div class="rr-stat-content">
                <span class="rr-stat-label">Sections Completed</span>
                <span class="rr-stat-value">{{ completedSections }} / 5</span>
              </div>
            </div>

            <div class="rr-stat-card">
              <mat-icon class="rr-stat-icon rr-stat-icon--success">work</mat-icon>
              <div class="rr-stat-content">
                <span class="rr-stat-label">Experience Entries</span>
                <span class="rr-stat-value">{{ experienceCount }}</span>
              </div>
            </div>

            <div class="rr-stat-card">
              <mat-icon class="rr-stat-icon rr-stat-icon--warning">school</mat-icon>
              <div class="rr-stat-content">
                <span class="rr-stat-label">Education Entries</span>
                <span class="rr-stat-value">{{ educationCount }}</span>
              </div>
            </div>

            <div class="rr-stat-card">
              <mat-icon class="rr-stat-icon rr-stat-icon--accent">stars</mat-icon>
              <div class="rr-stat-content">
                <span class="rr-stat-label">Skills Added</span>
                <span class="rr-stat-value">{{ skillsCount }}</span>
              </div>
            </div>
          </div>

          <div class="rr-review-checklist">
            <h4 class="rr-checklist-title">Resume Completeness</h4>
            <div class="rr-checklist-items">
              <div class="rr-checklist-item" [class.rr-checklist-item--complete]="hasPersonalInfo">
                <mat-icon>{{ hasPersonalInfo ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Personal information filled</span>
              </div>
              <div class="rr-checklist-item" [class.rr-checklist-item--complete]="hasSummary">
                <mat-icon>{{ hasSummary ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Professional summary added</span>
              </div>
              <div class="rr-checklist-item" [class.rr-checklist-item--complete]="hasExperience">
                <mat-icon>{{ hasExperience ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>At least one work experience</span>
              </div>
              <div class="rr-checklist-item" [class.rr-checklist-item--complete]="hasEducation">
                <mat-icon>{{ hasEducation ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Education background added</span>
              </div>
              <div class="rr-checklist-item" [class.rr-checklist-item--complete]="hasSkills">
                <mat-icon>{{ hasSkills ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Skills listed (at least 3)</span>
              </div>
            </div>

            <div class="rr-completion-bar">
              <div class="rr-completion-bar__fill"
                   [style.width.%]="completionPercentage"></div>
            </div>
            <p class="rr-completion-text">
              {{ completionPercentage }}% Complete
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  form: FormGroup;
  isEditing = false;
  isGenerating = false;
  summary = '';

  // Stats
  completedSections = 0;
  experienceCount = 0;
  educationCount = 0;
  skillsCount = 0;
  completionPercentage = 0;

  // Checklist
  hasPersonalInfo = false;
  hasSummary = false;
  hasExperience = false;
  hasEducation = false;
  hasSkills = false;

  constructor(
    private fb: FormBuilder,
    public store: ResumeBuilderService
  ) {
    this.form = this.fb.group({
      summary: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.summary = state.personal?.summary || '';
      this.experienceCount = state.experiences?.length || 0;
      this.educationCount = state.educations?.length || 0;
      this.skillsCount = state.skills?.length || 0;

      // Update checklist
      this.hasPersonalInfo = !!(state.personal?.firstName && state.personal?.email);
      this.hasSummary = !!this.summary;
      this.hasExperience = this.experienceCount > 0;
      this.hasEducation = this.educationCount > 0;
      this.hasSkills = this.skillsCount >= 3;

      // Calculate completion
      const checks = [
        this.hasPersonalInfo,
        this.hasSummary,
        this.hasExperience,
        this.hasEducation,
        this.hasSkills
      ];
      this.completedSections = checks.filter(Boolean).length;
      this.completionPercentage = Math.round((this.completedSections / 5) * 100);

      if (this.isEditing && !this.form.dirty) {
        this.form.patchValue({ summary: this.summary }, { emitEvent: false });
      }
    });
  }

  startManualEdit(): void {
    this.isEditing = true;
    this.form.patchValue({ summary: this.summary });
  }

  editSummary(): void {
    this.isEditing = true;
    this.form.patchValue({ summary: this.summary });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.form.reset();
  }

  saveSummary(): void {
    const summaryValue = this.form.value.summary?.trim();
    if (!summaryValue) return;

    this.store.update({
      personal: {
        ...this.store.snapshot.personal,
        summary: summaryValue
      }
    });

    this.isEditing = false;
  }

  deleteSummary(): void {
    this.store.update({
      personal: {
        ...this.store.snapshot.personal,
        summary: ''
      }
    });
  }

  generateWithAI(): void {
    this.isGenerating = true;

    const ctx = {
      personal: this.store.snapshot.personal,
      experiences: this.store.snapshot.experiences,
      skills: this.store.snapshot.skills,
      educations: this.store.snapshot.educations
    };

    this.store.generateWithAI('summary', ctx).subscribe({
      next: (res: any) => {
        this.isGenerating = false;
        if (res?.summary) {
          this.form.patchValue({ summary: res.summary });
          this.isEditing = true;
        }
      },
      error: () => {
        this.isGenerating = false;
      }
    });
  }
}
