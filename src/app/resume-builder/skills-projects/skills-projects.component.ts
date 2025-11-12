import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Skill, Project } from '../../shared/models/resume-builder.model';

@Component({
  selector: 'rr-skills-projects',
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
    MatChipsModule,
    MatSelectModule,
    MatTabsModule
  ],
  template: `
    <div class="rr-skills-projects">
      <div class="rr-section-header">
        <h2 class="rr-section-title">Skills & Projects</h2>
        <p class="rr-section-subtitle">Highlight your expertise and portfolio</p>
      </div>

      <mat-tab-group class="rr-tabs" animationDuration="300ms">
        <!-- Skills Tab -->
        <mat-tab label="Skills">
          <div class="rr-tab-content">
            <div class="rr-skills-grid" *ngIf="skills.length > 0">
              <div *ngFor="let skill of skills; let i = index" class="rr-skill-chip">
                <div class="rr-skill-chip__content">
                  <span class="rr-skill-chip__name">{{ skill.name }}</span>
                  <span class="rr-skill-chip__level" *ngIf="skill.level">{{ skill.level }}</span>
                </div>
                <button mat-icon-button (click)="deleteSkill(i)" class="rr-skill-chip__delete">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            <div class="rr-empty-state" *ngIf="skills.length === 0 && !showSkillForm">
              <mat-icon class="rr-empty-icon">engineering</mat-icon>
              <h3>No skills added yet</h3>
              <p>Add your technical and soft skills</p>
            </div>

            <form [formGroup]="skillForm" class="rr-form" *ngIf="showSkillForm">
              <mat-form-field appearance="outline" class="rr-form-field">
                <mat-label>Skill Name</mat-label>
                <input matInput formControlName="name" placeholder="TypeScript" />
                <mat-icon matPrefix>stars</mat-icon>
                <mat-error *ngIf="skillForm.get('name')?.hasError('required')">
                  Skill name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="rr-form-field">
                <mat-label>Proficiency Level</mat-label>
                <mat-select formControlName="level">
                  <mat-option value="Beginner">Beginner</mat-option>
                  <mat-option value="Intermediate">Intermediate</mat-option>
                  <mat-option value="Advanced">Advanced</mat-option>
                  <mat-option value="Expert">Expert</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="rr-form-actions">
                <button mat-stroked-button type="button" (click)="cancelSkillForm()">
                  Cancel
                </button>
                <button mat-flat-button color="primary" (click)="saveSkill()"
                        [disabled]="skillForm.invalid">
                  <mat-icon>add</mat-icon>
                  Add Skill
                </button>
              </div>
            </form>

            <button mat-flat-button color="primary" class="rr-add-button"
                    *ngIf="!showSkillForm" (click)="showAddSkillForm()">
              <mat-icon>add</mat-icon>
              Add Skill
            </button>
          </div>
        </mat-tab>

        <!-- Projects Tab -->
        <mat-tab label="Projects">
          <div class="rr-tab-content">
            <div class="rr-projects-list" *ngIf="projects.length > 0">
              <mat-card *ngFor="let project of projects; let i = index" class="rr-project-card">
                <mat-card-content>
                  <div class="rr-project-card__header">
                    <div class="rr-project-card__info">
                      <h3 class="rr-project-card__title">
                        {{ project.title }}
                        <a *ngIf="project.link" [href]="project.link" target="_blank"
                           class="rr-project-link" (click)="$event.stopPropagation()">
                          <mat-icon>open_in_new</mat-icon>
                        </a>
                      </h3>
                      <p class="rr-project-card__description" *ngIf="project.description">
                        {{ project.description }}
                      </p>
                      <div class="rr-project-card__tech" *ngIf="project.tech && project.tech.length > 0">
                        <span *ngFor="let tech of project.tech" class="rr-tech-badge">
                          {{ tech }}
                        </span>
                      </div>
                    </div>
                    <div class="rr-project-card__actions">
                      <button mat-icon-button (click)="editProject(i)" color="primary">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button (click)="deleteProject(i)" color="warn">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="rr-empty-state" *ngIf="projects.length === 0 && !showProjectForm">
              <mat-icon class="rr-empty-icon">folder_special</mat-icon>
              <h3>No projects added yet</h3>
              <p>Showcase your portfolio and side projects</p>
            </div>

            <form [formGroup]="projectForm" class="rr-form" *ngIf="showProjectForm">
              <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
                <mat-label>Project Title</mat-label>
                <input matInput formControlName="title" placeholder="E-commerce Platform" />
                <mat-icon matPrefix>folder</mat-icon>
                <mat-error *ngIf="projectForm.get('title')?.hasError('required')">
                  Project title is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"
                          placeholder="Built a full-stack e-commerce platform with real-time inventory management..."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
                <mat-label>Technologies Used</mat-label>
                <input matInput formControlName="tech"
                       placeholder="React, Node.js, MongoDB (comma separated)" />
                <mat-icon matPrefix>code</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="rr-form-field rr-form-field--full">
                <mat-label>Project Link</mat-label>
                <input matInput formControlName="link" type="url"
                       placeholder="https://github.com/username/project" />
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>

              <div class="rr-form-actions">
                <button mat-stroked-button type="button" (click)="cancelProjectForm()">
                  Cancel
                </button>
                <button mat-flat-button color="primary" (click)="saveProject()"
                        [disabled]="projectForm.invalid">
                  <mat-icon>{{ editingProjectIndex !== null ? 'save' : 'add' }}</mat-icon>
                  {{ editingProjectIndex !== null ? 'Update' : 'Add' }} Project
                </button>
              </div>
            </form>

            <button mat-flat-button color="primary" class="rr-add-button"
                    *ngIf="!showProjectForm" (click)="showAddProjectForm()">
              <mat-icon>add</mat-icon>
              Add Project
            </button>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrl: './skills-projects.component.scss'
})
export class SkillsProjectsComponent implements OnInit {
  skillForm: FormGroup;
  projectForm: FormGroup;
  showSkillForm = false;
  showProjectForm = false;
  editingProjectIndex: number | null = null;
  skills: Skill[] = [];
  projects: Project[] = [];

  constructor(
    private fb: FormBuilder,
    private store: ResumeBuilderService
  ) {
    this.skillForm = this.fb.group({
      name: ['', Validators.required],
      level: ['Intermediate']
    });

    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      tech: [''],
      link: ['']
    });
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.skills = state.skills || [];
      this.projects = state.projects || [];
    });
  }

  // Skills Methods
  showAddSkillForm(): void {
    this.showSkillForm = true;
    this.skillForm.reset({ level: 'Intermediate' });
  }

  cancelSkillForm(): void {
    this.showSkillForm = false;
    this.skillForm.reset({ level: 'Intermediate' });
  }

  saveSkill(): void {
    if (this.skillForm.invalid) return;

    const skill: Skill = {
      id: Date.now().toString(),
      name: this.skillForm.value.name,
      level: this.skillForm.value.level
    };

    const updatedSkills = [...this.skills, skill];
    this.store.replace({
      ...this.store.snapshot,
      skills: updatedSkills
    });

    this.cancelSkillForm();
  }

  deleteSkill(index: number): void {
    const updatedSkills = this.skills.filter((_, i) => i !== index);
    this.store.replace({
      ...this.store.snapshot,
      skills: updatedSkills
    });
  }

  // Projects Methods
  showAddProjectForm(): void {
    this.showProjectForm = true;
    this.editingProjectIndex = null;
    this.projectForm.reset();
  }

  cancelProjectForm(): void {
    this.showProjectForm = false;
    this.editingProjectIndex = null;
    this.projectForm.reset();
  }

  editProject(index: number): void {
    this.editingProjectIndex = index;
    const project = this.projects[index];
    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      tech: project.tech ? project.tech.join(', ') : '',
      link: project.link
    });
    this.showProjectForm = true;
  }

  saveProject(): void {
    if (this.projectForm.invalid) return;

    const formValue = this.projectForm.value;
    const techArray = formValue.tech
      ? formValue.tech.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    const project: Project = {
      id: this.editingProjectIndex !== null
        ? this.projects[this.editingProjectIndex].id
        : Date.now().toString(),
      title: formValue.title,
      description: formValue.description,
      tech: techArray,
      link: formValue.link
    };

    let updatedProjects: Project[];
    if (this.editingProjectIndex !== null) {
      updatedProjects = [...this.projects];
      updatedProjects[this.editingProjectIndex] = project;
    } else {
      updatedProjects = [...this.projects, project];
    }

    this.store.replace({
      ...this.store.snapshot,
      projects: updatedProjects
    });

    this.cancelProjectForm();
  }

  deleteProject(index: number): void {
    const updatedProjects = this.projects.filter((_, i) => i !== index);
    this.store.replace({
      ...this.store.snapshot,
      projects: updatedProjects
    });
  }
}
