import {
  Component,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TextFieldModule } from '@angular/cdk/text-field';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  gpa?: string;
  bullets: string[];
}

@Component({
  selector: 'rr-education',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TextFieldModule,
  ],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
})
export class EducationComponent {
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  // UI State
  showForm = signal(false);
  editingIndex = signal<number | null>(null);

  // Reactive Form
  form = this.fb.group({
    institution: ['', Validators.required],
    degree: ['', Validators.required],
    major: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null],
    isCurrent: [false],
    gpa: [''],
    bullets: this.fb.array<FormControl<string | null>>([]),
  });

  educationEntries = computed(() => this.store.state()?.educations ?? []);

  get bullets(): FormArray<FormControl<string | null>> {
    return this.form.controls.bullets as FormArray<FormControl<string | null>>;
  }

  constructor() {
    // Auto-add first bullet when form opens
    effect(() => {
      if (this.showForm() && this.bullets.length === 0) {
        untracked(() => this.addBullet());
      }
    });

    // React to isCurrent changes → toggle endDate validation
    effect(() => {
      const isCurrent = this.form.controls.isCurrent.value ?? false; // ← Fixed: null-safe
      const endDateCtrl = this.form.controls.endDate;

      if (isCurrent) {
        endDateCtrl.setValue(null);
        endDateCtrl.clearValidators();
        endDateCtrl.disable({ emitEvent: false });
      } else {
        endDateCtrl.enable({ emitEvent: false });
        endDateCtrl.setValidators(Validators.required);
      }
      endDateCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  showAddForm() {
    this.editingIndex.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingIndex.set(null);
  }

  editEntry(index: number) {
    const entry = this.educationEntries()[index];
    if (!entry) return;

    this.editingIndex.set(index);
    this.bullets.clear();

    entry.bullets.forEach(b => this.bullets.push(this.fb.control(b)));

    this.form.patchValue({
      institution: entry.institution,
      degree: entry.degree,
      major: entry.major,
      startDate: entry.startDate ? new Date(entry.startDate) : null,
      endDate: entry.isCurrent ? null : (entry.endDate ? new Date(entry.endDate) : null),
      isCurrent: entry.isCurrent,
      gpa: entry.gpa ?? '',
    });

    this.showForm.set(true);
  }

  deleteEntry(index: number) {
    const updated = this.educationEntries().filter((_, i) => i !== index);
    this.store.update({ educations: updated });
  }

  addBullet() {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number) {
    this.bullets.removeAt(index);
  }

  saveEntry() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const newEntry: EducationEntry = {
      id: Date.now().toString(),
      institution: (raw.institution ?? '').trim(),
      degree: (raw.degree ?? '').trim(),
      major: (raw.major ?? '').trim(),
      startDate: raw.startDate!.toISOString(),
      endDate: raw.isCurrent ? '' : (raw.endDate?.toISOString() ?? ''),
      isCurrent: !!raw.isCurrent,
      gpa: raw.gpa?.trim() || undefined,
      bullets: (raw.bullets ?? [])
        .map((b): string => (b ?? '').trim())
        .filter(Boolean),
    };

    const current = this.educationEntries();
    const updated = this.editingIndex() !== null
      ? current.map((e, i) => (i === this.editingIndex() ? { ...newEntry, id: e.id } : e))
      : [...current, newEntry];

    this.store.update({ educations: updated });
    this.cancelForm();
  }

  private resetForm() {
    this.form.reset({
      institution: '',
      degree: '',
      major: '',
      startDate: null,
      endDate: null,
      isCurrent: false,
      gpa: '',
    });
    this.bullets.clear();
  }
}
