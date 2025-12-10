import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';

import { ActivatedRoute } from '@angular/router';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ResumeBuilderState } from '../../shared/models/resume-builder.model';

/** UI Tab Type */
interface BuilderTab {
  label: string;
  icon: string;
  loader: () => Promise<any>;
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
    MatTooltipModule
  ],
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.scss'],
})
export class ResumeBuilderComponent implements OnInit {

  private resumeBuilder = inject(ResumeBuilderService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  // SSR helper
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Signals
  resumeId = signal<string | null>(null);
  currentTab = signal<number>(0);

  // Holds the currently loaded step component type (or null)
  currentStepComponent = signal<any | null>(null);

  // simple runtime cache to avoid re-importing the same component
  private loaderCache = new Map<number, any>();

  /** Local copy of the resume builder state */
  resumeState = signal<ResumeBuilderState>({
    _id: null,
    personal: {},
    educations: [],
    experiences: [],
    skills: [],
    projects: []
  });

  /** Tab configuration (loaders perform dynamic imports) */
  readonly tabs: BuilderTab[] = [
    { label: 'Contact', icon: 'person_outline', loader: () => import('../personal/personal.component').then(m => m.PersonalComponent) },
    { label: 'Education', icon: 'school', loader: () => import('../education/education.component').then(m => m.EducationComponent) },
    { label: 'Experience', icon: 'work_outline', loader: () => import('../experience/experience.component').then(m => m.ExperienceComponent) },
    { label: 'Projects', icon: 'folder_open', loader: () => import('../projects/projects').then(m => m.ProjectsComponent) },
    { label: 'Skills', icon: 'stars', loader: () => import('../skills/skills.component').then(m => m.SkillsComponent) },
    { label: 'Summary', icon: 'short_text', loader: () => import('../summary/summary.component').then(m => m.SummaryComponent) },
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
    // Sync query params (safe on server)
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
    // Load initial tab component
    this.loadTabComponent(this.currentTab());
  }

  /** Navigation */
  navigateToTab(index: number) {
    this.currentTab.set(index);
    this.loadTabComponent(index);
    this.scrollToTop();
  }

  nextStep() {
    if (this.currentTab() < this.tabs.length - 1) {
      const next = this.currentTab() + 1;
      this.currentTab.set(next);
      this.loadTabComponent(next);
    }
    this.scrollToTop();
  }

  previousStep() {
    if (this.currentTab() > 0) {
      const prev = this.currentTab() - 1;
      this.currentTab.set(prev);
      this.loadTabComponent(prev);
    }
    this.scrollToTop();
  }

  scrollToTop() {
    if (!this.isBrowser()) return;
    try {
      const el = document.querySelector('.content-wrapper');
      if (el) (el as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      /* noop */
    }
  }

  /**
   * Dynamic import + cache loader for a step index
   */
  private async loadTabComponent(index: number) {
    // if already cached, use it
    if (this.loaderCache.has(index)) {
      this.currentStepComponent.set(this.loaderCache.get(index));
      return;
    }

    try {
      const loader = this.tabs[index]?.loader;
      if (!loader) return;

      // show null while loading — template can show skeleton
      this.currentStepComponent.set(null);

      const comp = await loader();
      // store in cache
      this.loaderCache.set(index, comp);
      this.currentStepComponent.set(comp);

      // optional: prefetch next step in background
      const next = index + 1;
      if (this.tabs[next] && !this.loaderCache.has(next)) {
        this.tabs[next].loader().then(c => this.loaderCache.set(next, c)).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load step component', err);
    }
  }

  /** Prefetch loader on hover or demand */
  prefetchTab(index: number) {
    if (this.loaderCache.has(index)) return;
    const loader = this.tabs[index]?.loader;
    if (!loader) return;
    loader().then(c => this.loaderCache.set(index, c)).catch(() => {});
  }

  openPreview(): void {
    if (!this.isBrowser()) return; // only client

    import('../preview/preview.component').then(m => {
      const PreviewComponent = m.PreviewComponent;

      let isMobile = false;
      try {
        isMobile = window.innerWidth <= 768;
      } catch {
        isMobile = false;
      }

      const config: MatDialogConfig = {
        width: isMobile ? '100vw' : '100%',
        height: isMobile ? '100vh' : '90vh',
        maxWidth: isMobile ? '100vw' : '680px',
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'preview-modal-mobile' : 'preview-modal-desktop',
        data: { resumeId: this.resumeBuilder.snapshot._id },
        autoFocus: false
      };

      // open using the lazy component type
      this.dialog.open(PreviewComponent, config);
    }).catch(err => console.error('Failed to load preview component', err));
  }

  markCompleted() {
    this.resumeBuilder.completeResume().subscribe(res => {
      if (res) this.openPreview();
    });
  }
}
