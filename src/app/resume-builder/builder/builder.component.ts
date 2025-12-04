import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Still useful for pipes
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

@Component({
  selector: 'rr-resume-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
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
  // Services
  private resumeBuilder = inject(ResumeBuilderService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);

  // State Signals
  resumeId = signal<string | null>(null);
  currentTab = signal<number>(0);

  // Resume Data State (for completion tracking)
  private resumeState = signal<any>({});

  // Configuration
  readonly tabs = [
    { label: 'Contact', icon: 'person_outline', component: 'personal' },
    { label: 'Education', icon: 'school', component: 'education' },
    { label: 'Experience', icon: 'work_outline', component: 'experience' },
    { label: 'Projects', icon: 'folder_open', component: 'projects' },
    { label: 'Skills', icon: 'stars', component: 'skills' },
    { label: 'Summary', icon: 'short_text', component: 'summary' },
  ];

  // Computed Properties (Modern Reactivity)
  completionPercentage = computed(() => {
    const state = this.resumeState();
    if (!state) return 0;

    const checks = [
      !!(state.personal?.firstName && state.personal?.email), // Contact
      (state.educations?.length || 0) > 0, // Education
      (state.experiences?.length || 0) > 0, // Experience
      (state.projects?.length || 0) > 0,   // Projects
      (state.skills?.reduce((acc: number, cat: any) => acc + (cat.skills?.length || 0), 0) || 0) >= 3, // Skills
      !!state.personal?.summary // Summary
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  // Track specific section completion for UI indicators
  isTabCompleted(index: number): boolean {
    const state = this.resumeState();
    switch (index) {
      case 0: return !!(state.personal?.firstName && state.personal?.email);
      case 1: return (state.educations?.length || 0) > 0;
      case 2: return (state.experiences?.length || 0) > 0;
      case 3: return (state.projects?.length || 0) > 0;
      case 4: return (state.skills?.reduce((acc: number, cat: any) => acc + (cat.skills?.length || 0), 0) || 0) >= 3;
      case 5: return !!state.personal?.summary;
      default: return false;
    }
  }

  constructor() {
    // Read query params
    this.route.queryParams.subscribe(params => {
      this.resumeId.set(params['resumeId'] || null);
    });

    // Reactive effect to update local state when service state changes
    // In Angular 18+, toSignal is often better, but keeping subscription logic simple here
    this.resumeBuilder.state$.subscribe(state => {
      this.resumeState.set(state);
    });
  }

  ngOnInit(): void {
    if (this.resumeId()) {
      this.resumeBuilder.loadDraftFromServer();
    }
  }

  // Navigation Actions
  navigateToTab(index: number): void {
    this.currentTab.set(index);
    this.scrollToTop();
  }

  nextStep(): void {
    if (this.currentTab() < this.tabs.length - 1) {
      this.currentTab.update(v => v + 1);
      this.scrollToTop();
    }
  }

  previousStep(): void {
    if (this.currentTab() > 0) {
      this.currentTab.update(v => v - 1);
      this.scrollToTop();
    }
  }

  public scrollToTop() {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openPreview(): void {
    const isMobile = window.innerWidth <= 768;

    const dialogConfig: MatDialogConfig = {
      width: isMobile ? '100vw' : '100%',
      height: isMobile ? '100vh' : '90vh',
      maxWidth: isMobile ? '100vw' : 'none',
      maxHeight: isMobile ? '100vh' : '90vh',
      panelClass: isMobile ? 'preview-modal-mobile' : 'preview-modal-desktop',
      data: { resumeId: this.resumeId() },
      autoFocus: false,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms'
    };

    this.dialog.open(PreviewComponent, dialogConfig);
  }
}
