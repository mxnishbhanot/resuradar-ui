import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormControl
} from '@angular/forms';

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
import { ENTER, COMMA } from '@angular/cdk/keycodes';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Project } from '../../shared/models/resume-builder.model';

@Component({
  standalone: true,
  selector: 'rr-projects',
  providers: [DatePipe],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
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
  ]
})
export class ProjectsComponent {
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);
  private datePipe = inject(DatePipe);

  /** Signal-backed UI state */
  showForm = signal(false);
  editingIndex = signal<number | null>(null);
  projects = signal<Project[]>([]);

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    role: [''],
    link: ['', Validators.pattern('^(https?:\\/\\/)?[\\w.-]+\\.[a-z\\.]{2,6}([\\/\\w .-]*)*\\/?$')],
    startDate: ['', Validators.required],
    endDate: [''],
    isCurrent: [false],
    techStack: this.fb.array([]),
    bullets: this.fb.array([])
  });

  constructor() {
    /** Sync global project state → local projects signal */
    effect(() => {
      const state = this.store.state();
      this.projects.set(state.projects ?? []);
    });

    /** Enable/disable endDate based on "isCurrent" */
    effect(() => {
      const isCurrent = this.form.get('isCurrent')?.value;
      const endCtrl = this.form.get('endDate');
      if (isCurrent) {
        endCtrl?.disable({ emitEvent: false });
        endCtrl?.setValue('');
      } else {
        endCtrl?.enable({ emitEvent: false });
      }
    });
  }

  // ---------- FORM ARRAY HELPERS ----------

  get bullets(): FormArray {
    return this.form.get('bullets') as FormArray;
  }

  get techStackArray(): FormArray {
    return this.form.get('techStack') as FormArray;
  }

  get techStackControls(): FormControl[] {
    return this.techStackArray.controls as FormControl[];
  }

  // ---------- UI ACTIONS ----------

  showAddForm(): void {
    this.showForm.set(true);
    this.editingIndex.set(null);
    this.form.reset({ isCurrent: false });

    this.bullets.clear();
    this.techStackArray.clear();

    this.addBullet();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingIndex.set(null);
    this.form.reset({ isCurrent: false });

    this.bullets.clear();
    this.techStackArray.clear();
  }

  addBullet(): void {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number) {
    this.bullets.removeAt(index);
  }

  addTech(event: MatChipInputEvent): void {
    const value = (event.value ?? '').trim();
    if (value) {
      this.techStackArray.push(this.fb.control(value));
    }
    event.chipInput?.clear();
  }

  removeTech(index: number): void {
    this.techStackArray.removeAt(index);
  }

  // ---------- EDIT ----------

  editProject(index: number) {
    const project = this.projects()[index];
    this.editingIndex.set(index);

    this.showForm.set(true);

    this.bullets.clear();
    project.bullets?.forEach(b => this.bullets.push(this.fb.control(b)));

    this.techStackArray.clear();
    project.techStack?.forEach(t => this.techStackArray.push(this.fb.control(t)));

    this.form.patchValue({
      title: project.title,
      role: project.role || '',
      link: project.link || '',
      startDate: project.startDate,
      endDate: project.endDate,
      isCurrent: project.isCurrent
    });
  }

  // ---------- SAVE ----------

  saveProject(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    const project: Project = {
      id:
        this.editingIndex() !== null
          ? this.projects()[this.editingIndex()!].id
          : Date.now().toString(),
      title: v.title,
      role: v.role || undefined,
      link: v.link || undefined,
      startDate: v.startDate,
      endDate: v.isCurrent ? '' : v.endDate,
      isCurrent: v.isCurrent,
      techStack: v.techStack.filter((t: string) => t.trim()),
      bullets: v.bullets.filter((b: string) => b.trim())
    };

    const updated = [...this.projects()];

    if (this.editingIndex() !== null) {
      updated[this.editingIndex()!] = project;
    } else {
      updated.push(project);
    }

    this.store.update({ projects: updated });
    this.cancelForm();
  }

  // ---------- DELETE ----------

  deleteProject(index: number) {
    const updated = this.projects().filter((_, i) => i !== index);
    this.store.update({ projects: updated });
  }
}
