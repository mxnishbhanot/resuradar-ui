import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { PersonalComponent } from '../personal/personal.component';
import { EducationComponent } from '../education/education.component';
import { ExperienceComponent } from '../experience/experience.component';
import { SkillsProjectsComponent } from '../skills-projects/skills-projects.component';
import { SummaryComponent } from '../summary/summary.component';
import { PreviewComponent } from '../preview/preview.component';
import { ActivatedRoute } from '@angular/router';

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
  ],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss',
})
export class ResumeBuilderComponent implements OnInit {
  showPreview = false;
  isExporting = false;
  completionPercentage = 0;
  currentTab = 0;
  resumeId = null;

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
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {

    this.route.queryParams.subscribe(params => {
      this.resumeId = params['resumeId'];
    });
  }

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

  openPreview(): void {
    const dialogConfig: MatDialogConfig = {
      width: '100%',
      minWidth: 'fit-content',
      maxWidth: 'none',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'preview-modal-container',
      autoFocus: false,
      restoreFocus: true,
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'preview-modal-backdrop',
      data: { resumeId: this.resumeId },
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '250ms'
    };

    // Responsive configuration
    if (window.innerWidth <= 768) {
      dialogConfig.maxWidth = '100vw';
      dialogConfig.maxHeight = '100vh';
      dialogConfig.width = '100vw';
      dialogConfig.height = '100vh';
      dialogConfig.panelClass = 'preview-modal-container-mobile';
    }

    const dialogRef = this.dialog.open(PreviewComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      console.log('Preview modal closed with result:', result);
    });
  }
}
