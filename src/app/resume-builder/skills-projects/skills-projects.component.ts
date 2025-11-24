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
  templateUrl: './skills-projects.component.html',
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
