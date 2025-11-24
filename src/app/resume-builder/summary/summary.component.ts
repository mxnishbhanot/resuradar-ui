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
  templateUrl: './summary.component.html',
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
