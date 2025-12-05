import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // <-- ADD DatePipe
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
// <-- ADD Datepicker Imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  major: string;
  startDate: string; // Stored as ISO string
  endDate: string;   // Stored as ISO string or ''
  isCurrent: boolean;
  gpa?: string;
  bullets: string[];
}

@Component({
  selector: 'rr-education',
  standalone: true,
  providers: [DatePipe], // <-- ADD DatePipe provider
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
    CdkTextareaAutosize,
    MatDatepickerModule, // <-- ADD MatDatepickerModule
    MatNativeDateModule,  // <-- ADD MatNativeDateModule
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
  private datePipe = inject(DatePipe); // Inject DatePipe

  constructor() {
    this.initForm();
    this.setupEndDateToggle();
  }

  private initForm(): void {
    this.form = this.fb.group({
      institution: ['', Validators.required],
      degree: ['', Validators.required],
      major: ['', Validators.required],
      startDate: ['', Validators.required], // <-- Added required validation
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
        endDateControl?.clearValidators();
        endDateControl?.setValue('');
        endDateControl?.disable();
      } else {
        // End date is required only if it's not ongoing
        endDateControl?.setValidators(Validators.required);
        endDateControl?.enable();
      }
      endDateControl?.updateValueAndValidity();
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
    // Ensure endDate validation is active if not 'Ongoing'
    this.form.get('endDate')?.setValidators(Validators.required);
    this.form.get('endDate')?.updateValueAndValidity();
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

    // Patch with stored ISO strings/values for DatePicker and other fields
    this.form.patchValue({
      institution: entry.institution,
      degree: entry.degree,
      major: entry.major,
      startDate: entry.startDate, // ISO string - DatePicker will read this
      endDate: entry.endDate,     // ISO string - DatePicker will read this
      isCurrent: isOngoing,
      gpa: entry.gpa
    });

    // Manually run setup logic to handle required validator for endDate
    const endDateControl = this.form.get('endDate');
    if (isOngoing) {
      endDateControl?.clearValidators();
      endDateControl?.disable();
    } else {
      endDateControl?.setValidators(Validators.required);
      endDateControl?.enable();
    }
    endDateControl?.updateValueAndValidity();

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

    // Store raw date value (ISO string or Date object from DatePicker)
    const rawStartDate = formValue.startDate;
    const rawEndDate = formValue.isCurrent ? '' : formValue.endDate;

    const entryData: EducationEntry = {
      id: this.editingIndex !== null ? this.educationEntries[this.editingIndex].id : Date.now().toString(),
      institution: formValue.institution,
      degree: formValue.degree,
      major: formValue.major,
      startDate: rawStartDate, // Save as ISO string
      endDate: rawEndDate,     // Save as ISO string or empty string
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
