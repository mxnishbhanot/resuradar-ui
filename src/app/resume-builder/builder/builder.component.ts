import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
    MatDialogModule,
    PersonalComponent,
    EducationComponent,
    ExperienceComponent,
    SkillsProjectsComponent,
    SummaryComponent,
    PreviewComponent,
  ],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss',
})
export class ResumeBuilderComponent implements OnInit {
  showPreview = false;
  isExporting = false;
  completionPercentage = 0;
  currentTab = 0;

  tabs = [
    { label: 'CONTACT', icon: 'person' },
    { label: 'EDUCATION', icon: 'school' },
    { label: 'EXPERIENCE', icon: 'work' },
    { label: 'PROJECT', icon: 'folder' },
    { label: 'SUMMARY', icon: 'star' },
  ];

  hasPersonalInfo = false;
  hasEducation = false;
  hasExperience = false;
  hasSkills = false;

  constructor(
    private resumeBuilder: ResumeBuilderService,
    private snackBar: MatSnackBar
  ) {}

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

  navigateToTab(index: number): void {
    this.currentTab = index;
  }

  onStepChange(event: any): void {
    this.currentTab = event.selectedIndex;
  }

  nextStep(): void {
    if (this.currentTab < this.tabs.length - 1) {
      this.currentTab++;
    }
  }

  previousStep(): void {
    if (this.currentTab > 0) {
      this.currentTab--;
    }
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
      margin: [0.5, 0.5, 0.5, 0.5],
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
