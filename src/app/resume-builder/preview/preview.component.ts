import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeBuilderState } from '../../shared/models/resume-builder.model';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rr-preview" id="rr-resume-preview">
      <!-- Header Section -->
      <div class="rr-header">
        <h1 class="rr-name">
          {{ s.personal.firstName || 'Your Name' }}
          {{ s.personal.lastName || '' }}
        </h1>

        <p class="rr-headline" *ngIf="s.personal.headline">
          {{ s.personal.headline }}
        </p>

        <p class="rr-contact" *ngIf="hasContactInfo">
          {{ contactString }}
        </p>
      </div>

      <!-- Summary Section -->
      <section class="rr-section" *ngIf="s.personal.summary">
        <h2 class="rr-section-title">Professional Summary</h2>
        <p class="rr-summary">{{ s.personal.summary }}</p>
      </section>

      <!-- Experience Section -->
      <section class="rr-section" *ngIf="s.experiences?.length">
        <h2 class="rr-section-title">Professional Experience</h2>
        <div *ngFor="let exp of s.experiences; let last = last"
             class="rr-item"
             [class.rr-item--last]="last">
          <div class="rr-item-header">
            <h3 class="rr-item-title">{{ exp.title }}</h3>
            <p class="rr-item-company" *ngIf="exp.company">{{ exp.company }}</p>
          </div>
          <p class="rr-date" *ngIf="exp.startDate">
            {{ exp.startDate }} - {{ exp.isCurrent ? 'Present' : exp.endDate }}
          </p>
          <ul class="rr-bullets" *ngIf="exp.bullets?.length">
            <li *ngFor="let b of exp.bullets">{{ b }}</li>
          </ul>
        </div>
      </section>

      <!-- Education Section -->
      <section class="rr-section" *ngIf="s.educations?.length">
        <h2 class="rr-section-title">Education</h2>
        <div *ngFor="let edu of s.educations; let last = last"
             class="rr-item"
             [class.rr-item--last]="last">
          <h3 class="rr-item-title">{{ edu.school }}</h3>
          <p class="rr-degree" *ngIf="edu.degree || edu.field">
            {{ edu.degree }}{{ edu.field ? ' in ' + edu.field : '' }}
          </p>
          <p class="rr-date" *ngIf="edu.startYear">
            {{ edu.startYear }} - {{ edu.endYear || 'Present' }}
          </p>
          <p class="rr-description" *ngIf="edu.description">{{ edu.description }}</p>
        </div>
      </section>

      <!-- Skills Section -->
      <section class="rr-section" *ngIf="s.skills?.length">
        <h2 class="rr-section-title">Skills</h2>
        <p class="rr-skills">{{ skillsString }}</p>
      </section>

      <!-- Projects Section -->
      <section class="rr-section" *ngIf="s.projects?.length">
        <h2 class="rr-section-title">Projects</h2>
        <div *ngFor="let proj of s.projects; let last = last"
             class="rr-item"
             [class.rr-item--last]="last">
          <h3 class="rr-item-title">
            {{ proj.title }}
          </h3>
          <p class="rr-link" *ngIf="proj.link">{{ proj.link }}</p>
          <p class="rr-description" *ngIf="proj.description">{{ proj.description }}</p>
          <p class="rr-tech" *ngIf="proj.tech?.length">
            <strong>Technologies:</strong> {{ proj.tech?.join(', ') }}
          </p>
        </div>
      </section>

      <!-- Empty State -->
      <div class="rr-empty" *ngIf="isEmpty">
        <p>Your professional resume will appear here as you add information.</p>
        <p class="rr-empty-hint">Start by filling in your personal details in the form on the left.</p>
      </div>
    </div>
  `,
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {
  s: ResumeBuilderState = {} as any;
  isEmpty = true;
  hasContactInfo = false;
  contactString = '';
  skillsString = '';

  constructor(private store: ResumeBuilderService) {}

  ngOnInit(): void {
    this.store.state$.subscribe((state) => {
      this.s = state;
      this.updateStrings();
      this.updateFlags();
    });
  }

  private updateStrings(): void {
    const p = this.s.personal || {};
    this.contactString = [p.email, p.phone, p.location]
      .filter(Boolean)
      .join(' | ');

    this.skillsString = (this.s.skills || [])
      .map(s => s.name)
      .join(', ');
  }

  private updateFlags(): void {
    this.hasContactInfo = !!(this.s.personal?.email || this.s.personal?.phone || this.s.personal?.location);
    this.isEmpty = !(
      this.s.personal?.firstName ||
      this.s.personal?.summary ||
      (this.s.experiences?.length || 0) > 0 ||
      (this.s.educations?.length || 0) > 0 ||
      (this.s.skills?.length || 0) > 0 ||
      (this.s.projects?.length || 0) > 0
    );
  }
}
