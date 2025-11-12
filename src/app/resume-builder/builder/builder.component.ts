import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { PersonalComponent } from '../personal/personal.component';
import { EducationComponent } from '../education/education.component';
import { ExperienceComponent } from '../experience/experience.component';
import { SkillsProjectsComponent } from '../skills-projects/skills-projects.component';
import { SummaryComponent } from '../summary/summary.component';
import { PreviewComponent } from '../preview/preview.component';
import html2pdf from 'html2pdf.js';



@Component({
  selector: 'rr-resume-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    PersonalComponent,
    EducationComponent,
    ExperienceComponent,
    SkillsProjectsComponent,
    SummaryComponent,
    PreviewComponent,
  ],
  template: `
    <div class="rr-builder">
      <!-- Left Panel - Stepper -->
      <div class="rr-builder__left">
        <div class="rr-builder__header">
          <div class="rr-logo">
            <mat-icon class="rr-logo__icon">description</mat-icon>
            <h1 class="rr-logo__text">ResuRadar</h1>
          </div>
          <div class="rr-progress">
            <span class="rr-progress__text">{{ completionPercentage }}% Complete</span>
            <mat-progress-bar mode="determinate" [value]="completionPercentage"
                              class="rr-progress__bar"></mat-progress-bar>
          </div>
        </div>

        <mat-stepper linear #stepper class="rr-stepper" orientation="vertical">
          <mat-step label="Personal Details" state="person">
            <ng-template matStepLabel>
              <div class="rr-step-label">
                <span>Personal Details</span>
                <mat-icon *ngIf="hasPersonalInfo" class="rr-step-check">check_circle</mat-icon>
              </div>
            </ng-template>
            <rr-personal></rr-personal>
            <div class="rr-actions">
              <button mat-raised-button color="primary" (click)="stepper.next()">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Education" state="school">
            <ng-template matStepLabel>
              <div class="rr-step-label">
                <span>Education</span>
                <mat-icon *ngIf="hasEducation" class="rr-step-check">check_circle</mat-icon>
              </div>
            </ng-template>
            <rr-education></rr-education>
            <div class="rr-actions">
              <button mat-button (click)="stepper.previous()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-raised-button color="primary" (click)="stepper.next()">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Experience" state="work">
            <ng-template matStepLabel>
              <div class="rr-step-label">
                <span>Work Experience</span>
                <mat-icon *ngIf="hasExperience" class="rr-step-check">check_circle</mat-icon>
              </div>
            </ng-template>
            <rr-experience></rr-experience>
            <div class="rr-actions">
              <button mat-button (click)="stepper.previous()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-raised-button color="primary" (click)="stepper.next()">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Skills & Projects" state="stars">
            <ng-template matStepLabel>
              <div class="rr-step-label">
                <span>Skills & Projects</span>
                <mat-icon *ngIf="hasSkills" class="rr-step-check">check_circle</mat-icon>
              </div>
            </ng-template>
            <rr-skills-projects></rr-skills-projects>
            <div class="rr-actions">
              <button mat-button (click)="stepper.previous()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-raised-button color="primary" (click)="stepper.next()">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-step>

          <mat-step label="Review & Download" state="done">
            <ng-template matStepLabel>
              <div class="rr-step-label">
                <span>Review & Download</span>
              </div>
            </ng-template>
            <rr-summary></rr-summary>
            <div class="rr-actions rr-actions--final">
              <button mat-button (click)="stepper.previous()">
                <mat-icon>arrow_back</mat-icon>
                Back
              </button>
              <button mat-raised-button color="accent" (click)="exportPDF()"
                      [disabled]="isExporting">
                <mat-icon>{{ isExporting ? 'hourglass_empty' : 'download' }}</mat-icon>
                {{ isExporting ? 'Generating...' : 'Download PDF' }}
              </button>
            </div>
          </mat-step>

          <!-- Step Icons -->
          <ng-template matStepperIcon="person">
            <mat-icon>person</mat-icon>
          </ng-template>
          <ng-template matStepperIcon="school">
            <mat-icon>school</mat-icon>
          </ng-template>
          <ng-template matStepperIcon="work">
            <mat-icon>work</mat-icon>
          </ng-template>
          <ng-template matStepperIcon="stars">
            <mat-icon>stars</mat-icon>
          </ng-template>
          <ng-template matStepperIcon="done">
            <mat-icon>done_all</mat-icon>
          </ng-template>
        </mat-stepper>
      </div>

      <!-- Right Panel - Preview -->
      <div class="rr-builder__right">
        <div class="rr-preview-container">
          <div class="rr-preview-header">
            <h2 class="rr-preview-title">
              <mat-icon>visibility</mat-icon>
              Live Preview
            </h2>
            <button mat-icon-button (click)="togglePreview()" class="rr-preview-toggle">
              <mat-icon>{{ showPreview ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          <div class="rr-preview-card" *ngIf="showPreview">
            <rr-preview></rr-preview>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './builder.component.scss',
})
export class ResumeBuilderComponent implements OnInit {
  showPreview = true;
  isExporting = false;
  completionPercentage = 0;

  hasPersonalInfo = false;
  hasEducation = false;
  hasExperience = false;
  hasSkills = false;

  constructor(
    private resumeBuilder: ResumeBuilderService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.resumeBuilder.state$.subscribe(state => {
      this.updateCompletionStatus(state);
    });
  }

  private updateCompletionStatus(state: any): void {
    this.hasPersonalInfo = !!(state.personal?.firstName && state.personal?.email);
    this.hasEducation = (state.educations?.length || 0) > 0;
    this.hasExperience = (state.experiences?.length || 0) > 0;
    this.hasSkills = (state.skills?.length || 0) >= 3;

    const checks = [
      this.hasPersonalInfo,
      !!state.personal?.summary,
      this.hasExperience,
      this.hasEducation,
      this.hasSkills
    ];

    this.completionPercentage = Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

exportPDF(): void {
  this.isExporting = true;

  const element = document.getElementById('rr-resume-preview');
  if (!element) {
    this.isExporting = false;
    this.snackBar.open('Resume preview not found.', 'Close', { duration: 3000 });
    return;
  }

  const state = this.resumeBuilder.snapshot;
  const firstName = state.personal?.firstName || 'resume';
  const lastName = state.personal?.lastName || 'document';
  const filename = `${firstName}_${lastName}_Resume.pdf`;

  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5], // inches
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  } as any;

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      this.isExporting = false;
      this.snackBar.open('Resume downloaded successfully!', 'Close', { duration: 3000 });
    })
    .catch(() => {
      this.isExporting = false;
      this.snackBar.open('Error generating PDF. Please try again.', 'Close', { duration: 3000 });
    });
}

}
