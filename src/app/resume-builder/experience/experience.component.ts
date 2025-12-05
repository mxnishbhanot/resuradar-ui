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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
// <-- ADD Datepicker Imports
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string; // Stored as ISO string
  endDate: string;   // Stored as ISO string or ''
  isCurrent: boolean;
  bullets: string[];
}

@Component({
  selector: 'rr-experience',
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
    MatProgressSpinnerModule,
    CdkTextareaAutosize,
    MatDatepickerModule, // <-- ADD MatDatepickerModule
    MatNativeDateModule,  // <-- ADD MatNativeDateModule
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
})
export class ExperienceComponent implements OnInit {
  form!: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  experiences: Experience[] | any = [];
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);
  private datePipe = inject(DatePipe); // Inject DatePipe (although only used in template now)

  constructor() {
    this.initForm();
    this.setupEndDateToggle();
  }

  private initForm(): void {
    // Added required validators for company and startDate
    this.form = this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required], // Added required validation
      startDate: ['', Validators.required], // Added required validation
      endDate: [''],
      isCurrent: [false],
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
        // End date is required only if it's not a current role
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
      this.experiences = state.experiences || [];
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
    this.addBullet();
    // Ensure endDate validation is active if not 'Current Role'
    this.form.get('endDate')?.setValidators(Validators.required);
    this.form.get('endDate')?.updateValueAndValidity();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset({ isCurrent: false });
    this.bullets.clear();
  }

  addBullet(): void {
    this.bullets.push(this.fb.control(''));
  }

  removeBullet(index: number): void {
    this.bullets.removeAt(index);
  }

  editExperience(index: number): void {
    this.editingIndex = index;
    const exp = this.experiences[index];
    const isCurrentlyWorking = exp.isCurrent;

    this.bullets.clear();
    if (exp.bullets && exp.bullets.length > 0) {
      exp.bullets.forEach((bullet: string) => this.bullets.push(this.fb.control(bullet)));
    } else {
      this.addBullet();
    }

    // Patch with stored ISO strings/values for DatePicker and other fields
    this.form.patchValue({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate, // ISO string - DatePicker will read this
      endDate: exp.endDate,     // ISO string - DatePicker will read this
      isCurrent: isCurrentlyWorking
    });

    // Manually run setup logic to handle required validator for endDate
    const endDateControl = this.form.get('endDate');
    if (isCurrentlyWorking) {
      endDateControl?.clearValidators();
      endDateControl?.disable();
    } else {
      endDateControl?.setValidators(Validators.required);
      endDateControl?.enable();
    }
    endDateControl?.updateValueAndValidity();

    this.showForm = true;
  }

  saveExperience(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    const bulletValues = formValue.bullets.filter((b: string) => b && b.trim());

    // Store raw date value (ISO string or Date object from DatePicker)
    const rawStartDate = formValue.startDate;
    const rawEndDate = formValue.isCurrent ? '' : formValue.endDate;

    const experience: Experience = {
      id: this.editingIndex !== null ? this.experiences[this.editingIndex].id : Date.now().toString(),
      title: formValue.title,
      company: formValue.company,
      startDate: rawStartDate, // Save as ISO string
      endDate: rawEndDate,     // Save as ISO string or empty string
      isCurrent: formValue.isCurrent,
      bullets: bulletValues
    };

    let updatedExperiences = [...this.experiences];
    if (this.editingIndex !== null) {
      updatedExperiences[this.editingIndex] = experience;
    } else {
      updatedExperiences.push(experience);
    }

    this.store.update({ experiences: updatedExperiences });
    this.cancelForm();
  }

  deleteExperience(index: number): void {
    const updatedExperiences: Experience[] = this.experiences.filter((_: Experience, i: number) => i !== index);
    this.store.update({ experiences: updatedExperiences });
  }
}
