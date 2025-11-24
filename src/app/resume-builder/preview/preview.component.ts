import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeBuilderState } from '../../shared/models/resume-builder.model';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="resume-paper" id="rr-resume-preview" [class.is-empty]="isEmpty">

      <div class="paper-content" *ngIf="!isEmpty; else emptyState">

        <!-- Header Section -->
        <header class="resume-header">
          <h1 class="full-name">
            {{ s.personal.firstName || 'YOUR' }} {{ s.personal.lastName || 'NAME' }}
          </h1>

          <p class="headline" *ngIf="s.personal.headline">
            {{ s.personal.headline }}
          </p>

          <div class="contact-info" *ngIf="hasContactInfo">
            <span class="contact-item" *ngIf="s.personal.email">
              {{ s.personal.email }}
            </span>
            <span class="separator" *ngIf="s.personal.email && s.personal.phone">•</span>
            <span class="contact-item" *ngIf="s.personal.phone">
              {{ s.personal.phone }}
            </span>
            <span class="separator" *ngIf="(s.personal.email || s.personal.phone) && s.personal.location">•</span>
            <span class="contact-item" *ngIf="s.personal.location">
              {{ s.personal.location }}
            </span>
          </div>

          <div class="social-links" *ngIf="s.personal.linkedin || s.personal.github">
            <span class="social-item" *ngIf="s.personal.linkedin">
              {{ s.personal.linkedin }}
            </span>
            <span class="separator" *ngIf="s.personal.linkedin && s.personal.github">•</span>
            <span class="social-item" *ngIf="s.personal.github">
              {{ s.personal.github }}
            </span>
          </div>
        </header>

        <!-- Professional Summary -->
        <section class="resume-section" *ngIf="s.personal.summary">
          <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
          <div class="section-divider"></div>
          <p class="summary-text">{{ s.personal.summary }}</p>
        </section>

        <!-- Experience -->
        <section class="resume-section" *ngIf="s.experiences?.length">
          <h2 class="section-title">EXPERIENCE</h2>
          <div class="section-divider"></div>

          <div class="experience-list">
            <div *ngFor="let exp of s.experiences; let last = last"
                 class="experience-item"
                 [class.last-item]="last">
              <div class="exp-header">
                <div class="exp-main">
                  <h3 class="job-title">{{ exp.title }}</h3>
                  <p class="company-name">{{ exp.company }}</p>
                </div>
                <div class="date-range" *ngIf="exp.startDate">
                  {{ exp.startDate }} - {{ exp.isCurrent ? 'Present' : exp.endDate }}
                </div>
              </div>

              <ul class="bullet-list" *ngIf="exp.bullets?.length">
                <li *ngFor="let bullet of exp.bullets">{{ bullet }}</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Education -->
        <section class="resume-section" *ngIf="s.educations?.length">
          <h2 class="section-title">EDUCATION</h2>
          <div class="section-divider"></div>

          <div class="education-list">
            <div *ngFor="let edu of s.educations; let last = last"
                 class="education-item"
                 [class.last-item]="last">
              <div class="edu-header">
                <div class="edu-main">
                  <h3 class="school-name">{{ edu.school }}</h3>
                  <p class="degree-info" *ngIf="edu.degree || edu.field">
                    {{ edu.degree }}<span *ngIf="edu.field"> in {{ edu.field }}</span>
                  </p>
                </div>
                <div class="date-range" *ngIf="edu.startYear">
                  {{ edu.startYear }} - {{ edu.endYear || 'Present' }}
                </div>
              </div>

              <p class="edu-description" *ngIf="edu.description">{{ edu.description }}</p>
            </div>
          </div>
        </section>

        <!-- Skills -->
        <section class="resume-section" *ngIf="s.skills?.length">
          <h2 class="section-title">SKILLS</h2>
          <div class="section-divider"></div>

          <div class="skills-container">
            <span *ngFor="let skill of s.skills; let last = last" class="skill-item">
              {{ skill.name }}<span *ngIf="!last" class="skill-separator">•</span>
            </span>
          </div>
        </section>

        <!-- Projects -->
        <section class="resume-section" *ngIf="s.projects?.length">
          <h2 class="section-title">PROJECTS</h2>
          <div class="section-divider"></div>

          <div class="projects-list">
            <div *ngFor="let proj of s.projects; let last = last"
                 class="project-item"
                 [class.last-item]="last">
              <div class="project-header">
                <h3 class="project-title">{{ proj.title }}</h3>
                <span class="project-link" *ngIf="proj.link">{{ proj.link }}</span>
              </div>

              <p class="project-description" *ngIf="proj.description">
                {{ proj.description }}
              </p>

              <p class="project-tech" *ngIf="proj.tech?.length">
                <strong>Technologies:</strong> {{ proj.tech?.join(', ') }}
              </p>
            </div>
          </div>
        </section>

      </div>

      <!-- Empty State -->
      <ng-template #emptyState>
        <div class="empty-state-wrapper">
          <div class="empty-illustration">
            <div class="circle-bg"></div>
            <mat-icon>description</mat-icon>
          </div>
          <h3 class="empty-title">Your Resume Awaits</h3>
          <p class="empty-description">
            Start adding your information to see your professional resume come to life.
          </p>
          <div class="empty-steps">
            <div class="step-item">
              <mat-icon>person</mat-icon>
              <span>Add personal details</span>
            </div>
            <div class="step-item">
              <mat-icon>work</mat-icon>
              <span>Include work experience</span>
            </div>
            <div class="step-item">
              <mat-icon>school</mat-icon>
              <span>List your education</span>
            </div>
          </div>
        </div>
      </ng-template>

    </div>
  `,
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {
  s: ResumeBuilderState = {} as any;
  isEmpty = true;
  hasContactInfo = false;

  constructor(private store: ResumeBuilderService) {}

  ngOnInit(): void {
    this.store.state$.subscribe((state) => {
      this.s = state;
      if (!this.s.personal) {
        this.s.personal = {} as any;
      }
      this.updateFlags();
    });
  }

  private updateFlags(): void {
    this.hasContactInfo = !!(
      this.s.personal?.email ||
      this.s.personal?.phone ||
      this.s.personal?.location
    );

    this.isEmpty = !(
      this.s.personal?.firstName ||
      this.s.personal?.lastName ||
      this.s.personal?.summary ||
      (this.s.experiences?.length || 0) > 0 ||
      (this.s.educations?.length || 0) > 0 ||
      (this.s.skills?.length || 0) > 0
    );
  }
}
