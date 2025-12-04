import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
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
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule,
    CdkTextareaAutosize
  ],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
})
export class EducationComponent implements OnInit {
  form!: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  educationEntries: EducationEntry[] = [];
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  constructor() {
    this.initForm();
    this.setupEndDateToggle();
  }

  private initForm(): void {
    this.form = this.fb.group({
      institution: ['', Validators.required],
      degree: ['', Validators.required],
      major: ['', Validators.required],
      startDate: [''],
      endDate: [''],
      isCurrent: [false],
      gpa: [''],
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

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.educationEntries = state.educations || [];
    });
  }

  addBullet(): void {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number): void {
    this.bullets.removeAt(index);
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.addBullet();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
  }

  editEntry(index: number): void {
    this.editingIndex = index;
    const entry = this.educationEntries[index];
    const isOngoing = entry.isCurrent;

    this.bullets.clear();
    if (entry.bullets && entry.bullets.length > 0) {
      entry.bullets.forEach(bullet => this.bullets.push(this.fb.control(bullet)));
    } else {
      this.addBullet();
    }

    this.form.patchValue({
      institution: entry.institution,
      degree: entry.degree,
      major: entry.major,
      startDate: entry.startDate,
      endDate: entry.endDate,
      isCurrent: isOngoing,
      gpa: entry.gpa
    });

    if (isOngoing) {
      this.form.get('endDate')?.disable();
    } else {
      this.form.get('endDate')?.enable();
    }
    this.showForm = true;
  }

  deleteEntry(index: number): void {
    const updatedEntries = [...this.educationEntries];
    updatedEntries.splice(index, 1);
    this.store.update({ educations: updatedEntries });
  }

  saveEntry(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    const filteredBullets = formValue.bullets.filter((b: string) => b && b.trim());

    const entryData: EducationEntry = {
      id: this.editingIndex !== null ? this.educationEntries[this.editingIndex].id : Date.now().toString(),
      institution: formValue.institution,
      degree: formValue.degree,
      major: formValue.major,
      startDate: formValue.startDate,
      endDate: formValue.isCurrent ? '' : formValue.endDate,
      isCurrent: formValue.isCurrent,
      gpa: formValue.gpa,
      bullets: filteredBullets
    };

    let updatedEntries = [...this.educationEntries];
    if (this.editingIndex !== null) {
      updatedEntries[this.editingIndex] = entryData;
    } else {
      updatedEntries.push(entryData);
    }

    this.store.update({ educations: updatedEntries });
    this.cancelForm();
  }
}
