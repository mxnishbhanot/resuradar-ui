import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';

import { ActivatedRoute } from '@angular/router';

// Feature Components
import { PersonalComponent } from '../personal/personal.component';
import { EducationComponent } from '../education/education.component';
import { ExperienceComponent } from '../experience/experience.component';
import { SummaryComponent } from '../summary/summary.component';
import { ProjectsComponent } from '../projects/projects';
import { SkillsComponent } from '../skills/skills.component';
import { PreviewComponent } from '../preview/preview.component';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ResumeBuilderState } from '../../shared/models/resume-builder.model';

/** UI Tab Type */
interface BuilderTab {
  label: string;
  icon: string;
  component: string;
}

@Component({
  selector: 'rr-resume-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTooltipModule,

    PersonalComponent,
    EducationComponent,
    ExperienceComponent,
    SummaryComponent,
    ProjectsComponent,
    SkillsComponent
  ],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss',
})
export class ResumeBuilderComponent implements OnInit {

  // Inject Services
  private resumeBuilder = inject(ResumeBuilderService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);

  // Signals
  resumeId = signal<string | null>(null);
  currentTab = signal<number>(0);

  /** Local copy of the resume builder state */
  resumeState = signal<ResumeBuilderState>({
    _id: null,
    personal: {},
    educations: [],
    experiences: [],
    skills: [],
    projects: []
  });

  /** Tab configuration (strict-typed) */
  readonly tabs: BuilderTab[] = [
    { label: 'Contact', icon: 'person_outline', component: 'personal' },
    { label: 'Education', icon: 'school', component: 'education' },
    { label: 'Experience', icon: 'work_outline', component: 'experience' },
    { label: 'Projects', icon: 'folder_open', component: 'projects' },
    { label: 'Skills', icon: 'stars', component: 'skills' },
    { label: 'Summary', icon: 'short_text', component: 'summary' },
  ];

  /** ✔ Fully reactive progress indicator */
  completionPercentage = computed(() => {
    const s = this.resumeState();

    const checks = [
      !!(s.personal?.firstName && s.personal?.email),
      (s.educations?.length || 0) > 0,
      (s.experiences?.length || 0) > 0,
      (s.projects?.length || 0) > 0,
      (s.skills?.reduce((sum, cat) => sum + (cat.skills?.length || 0), 0) || 0) >= 3,
      !!s.personal?.summary
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  /** ✔ Track each tab individually */
  isTabCompleted = (index: number): boolean => {
    const s = this.resumeState();

    switch (index) {
      case 0: return !!(s.personal?.firstName && s.personal?.email);
      case 1: return (s.educations?.length || 0) > 0;
      case 2: return (s.experiences?.length || 0) > 0;
      case 3: return (s.projects?.length || 0) > 0;
      case 4:
        return (s.skills?.reduce((sum, cat) => sum + (cat.skills?.length || 0), 0) || 0) >= 3;
      case 5: return !!s.personal?.summary;
      default: return false;
    }
  };

  constructor() {
    // Sync query params
    this.route.queryParamMap.subscribe(params => {
      this.resumeId.set(params.get('resumeId'));
    });

    // Sync service → local state (using signals)
    effect(() => {
      const state = this.resumeBuilder.state();
      this.resumeState.set(state);
    });
  }

  ngOnInit(): void {
    // Do NOT call loadDraftFromServer()
    // ResumeBuilderService automatically manages loading based on URL now.
  }

  // Navigation
  navigateToTab(index: number) {
    this.currentTab.set(index);
    this.scrollToTop();
  }

  nextStep() {
    if (this.currentTab() < this.tabs.length - 1) {
      this.currentTab.update(v => v + 1);
    }
    this.scrollToTop();
  }

  previousStep() {
    if (this.currentTab() > 0) {
      this.currentTab.update(v => v - 1);
    }
    this.scrollToTop();
  }

  scrollToTop() {
    const el = document.querySelector('.content-wrapper');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openPreview(): void {
    const isMobile = window.innerWidth <= 768;

    const config: MatDialogConfig = {
      width: isMobile ? '100vw' : '100%',
      height: isMobile ? '100vh' : '90vh',
      maxWidth: isMobile ? '100vw' : 'none',
      maxHeight: isMobile ? '100vh' : '90vh',
      panelClass: isMobile ? 'preview-modal-mobile' : 'preview-modal-desktop',
      data: { resumeId: this.resumeBuilder.snapshot._id },
      autoFocus: false
    };

    this.dialog.open(PreviewComponent, config)
  }

  markCompleted() {
    this.resumeBuilder.completeResume().subscribe(res => {
      if (res) this.openPreview();
    });
  }
}
