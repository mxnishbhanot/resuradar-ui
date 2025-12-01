import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

// Assuming data service and model exist (adjust paths if needed)
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Project } from '../../shared/models/resume-builder.model';  // CHANGED: Import from model

// Local Model Definition (matches global now, removed duplicate)
@Component({
  selector: 'rr-projects',
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
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    CdkTextareaAutosize // Required for auto-sizing textarea
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsComponent implements OnInit {
  // Key codes for adding chips (Tech Stack)
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  form!: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  projects: Project[] = [];  // CHANGED: Typed to Project[]

  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);  // CHANGED: Use inject() for standalone

  constructor() {
    this.initForm();
    this.setupEndDateToggle();
  }

  // === Form Setup ===
  private initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      role: [''],
      link: [''],
      startDate: [''],
      endDate: [''],
      isCurrent: [false],
      techStack: this.fb.array([]),
      bullets: this.fb.array([])
    });
  }

  private setupEndDateToggle(): void {
    // Disable endDate when isCurrent is checked
    this.form.get('isCurrent')?.valueChanges.subscribe(isCurrent => {
      const endDateControl = this.form.get('endDate');
      if (isCurrent) {
        endDateControl?.setValue('');
        endDateControl?.disable();
      } else {
        endDateControl?.enable();
      }
    });
  }

  // === FormArray Getters ===
  get bullets(): FormArray {
    return this.form.get('bullets') as FormArray;
  }

  get techStackArray(): FormArray {
    return this.form.get('techStack') as FormArray;
  }

  get techStackControls(): FormControl[] {
    return this.techStackArray.controls as FormControl[];
  }

  // === Component Lifecycle ===
  ngOnInit(): void {
    // CHANGED: Typed to Project[]
    this.store.state$.subscribe(state => {
      this.projects = state.projects || [];
    });
  }

  // === Bullet Point Management (Reused from Experience) ===
  addBullet(): void {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number): void {
    this.bullets.removeAt(index);
  }

  // === Tech Stack Chip Management (Reused from Skills) ===
  addTech(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.techStackArray.push(this.fb.control(value));
    }
    event.chipInput!.clear();
  }

  removeTech(index: number): void {
    this.techStackArray.removeAt(index);
  }

  // === UI & CRUD Handlers ===
  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.techStackArray.clear();
    this.addBullet(); // Start with one empty bullet point
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.techStackArray.clear();
  }

  editProject(index: number): void {
    this.editingIndex = index;
    const proj = this.projects[index];
    const isOngoing = proj.isCurrent;

    // Clear and populate FormArrays
    this.bullets.clear();
    if (proj.bullets && proj.bullets.length > 0) {
      proj.bullets.forEach((bullet: string) => this.bullets.push(this.fb.control(bullet)));  // CHANGED: Typed as string
    } else {
      this.addBullet();
    }

    this.techStackArray.clear();
    if (proj.techStack && proj.techStack.length > 0) {
      proj.techStack.forEach((tech: string) => this.techStackArray.push(this.fb.control(tech)));  // CHANGED: Typed as string
    }

    this.form.patchValue({
      title: proj.title,
      role: proj.role,
      link: proj.link,
      startDate: proj.startDate,
      endDate: proj.endDate,
      isCurrent: isOngoing
    });

    // Manually ensure controls are enabled/disabled
    if (isOngoing) {
      this.form.get('endDate')?.disable();
    } else {
      this.form.get('endDate')?.enable();
    }

    this.showForm = true;
  }

  deleteProject(index: number): void {
    const updatedProjects = [...this.projects];
    updatedProjects.splice(index, 1);
    this.store.update({ projects: updatedProjects });  // Triggers autosave
  }

  saveProject(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    const filteredBullets = formValue.bullets.filter((b: string) => b && b.trim());

    const projectData: Project = {
      id: this.editingIndex !== null ? this.projects[this.editingIndex].id : Date.now().toString(),
      title: formValue.title,
      role: formValue.role,
      link: formValue.link,
      startDate: formValue.startDate,
      endDate: formValue.isCurrent ? '' : formValue.endDate,
      isCurrent: formValue.isCurrent,
      techStack: formValue.techStack.filter((t: string) => t && t.trim()),  // CHANGED: Filter empty tech
      bullets: filteredBullets
    };

    let updatedProjects = [...this.projects];

    if (this.editingIndex !== null) {
      // Update existing
      updatedProjects[this.editingIndex] = projectData;
    } else {
      // Add new
      updatedProjects.push(projectData);
    }

    this.store.update({ projects: updatedProjects });  // Triggers autosave

    // Reset UI
    this.cancelForm();
  }
}
