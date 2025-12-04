import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Project } from '../../shared/models/resume-builder.model';

@Component({
  selector: 'rr-projects',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CdkTextareaAutosize
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsComponent implements OnInit {
  form!: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  projects: Project[] = [];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  constructor() {
    this.initForm();
    this.setupEndDateToggle();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      role: [''],
      link: [''],
      startDate: [''],
      endDate: [''],
      isCurrent: [false],
      techStack: this.fb.array([]), // This is now just an array of controls, not bound to the grid
      bullets: this.fb.array([])
    });
  }

  private setupEndDateToggle(): void {
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

  get bullets(): FormArray {
    return this.form.get('bullets') as FormArray;
  }

  get techStackArray(): FormArray {
    return this.form.get('techStack') as FormArray;
  }

  get techStackControls() {
    return this.techStackArray.controls as FormControl[];
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.projects = state.projects || [];
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.techStackArray.clear();
    this.addBullet();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.techStackArray.clear();
  }

  addBullet(): void {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number): void {
    this.bullets.removeAt(index);
  }

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

  editProject(index: number): void {
    this.editingIndex = index;
    const proj = this.projects[index];
    const isOngoing = proj.isCurrent;

    this.bullets.clear();
    if (proj.bullets && proj.bullets.length > 0) {
      proj.bullets.forEach(bullet => this.bullets.push(this.fb.control(bullet)));
    } else {
      this.addBullet();
    }

    this.techStackArray.clear();
    if (proj.techStack && proj.techStack.length > 0) {
      proj.techStack.forEach(tech => this.techStackArray.push(this.fb.control(tech)));
    }

    this.form.patchValue({
      title: proj.title,
      role: proj.role || '',
      link: proj.link || '',
      startDate: proj.startDate,
      endDate: proj.endDate,
      isCurrent: isOngoing
    });

    if (isOngoing) {
      this.form.get('endDate')?.disable();
    } else {
      this.form.get('endDate')?.enable();
    }
    this.showForm = true;
  }

  saveProject(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue(); // getRawValue includes disabled controls
    const filteredBullets = formValue.bullets.filter((b: string) => b && b.trim());
    const filteredTechStack = formValue.techStack.filter((t: string) => t && t.trim());

    const project: Project = {
      id: this.editingIndex !== null ? this.projects[this.editingIndex].id : Date.now().toString(),
      title: formValue.title,
      role: formValue.role || undefined,
      link: formValue.link || undefined,
      startDate: formValue.startDate, // This will be the date string from the picker
      endDate: formValue.isCurrent ? '' : formValue.endDate, // This will be the date string or empty
      isCurrent: formValue.isCurrent,
      techStack: filteredTechStack,
      bullets: filteredBullets
    };

    let updatedProjects = [...this.projects];
    if (this.editingIndex !== null) {
      updatedProjects[this.editingIndex] = project;
    } else {
      updatedProjects.push(project);
    }

    this.store.update({ projects: updatedProjects });
    this.cancelForm();
  }

  deleteProject(index: number): void {
    const updatedProjects = this.projects.filter((_, i) => i !== index);
    this.store.update({ projects: updatedProjects });
  }
}
