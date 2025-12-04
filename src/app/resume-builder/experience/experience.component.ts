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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkTextareaAutosize, TextFieldModule } from '@angular/cdk/text-field';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

@Component({
  selector: 'rr-experience',
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
    MatProgressSpinnerModule,
    CdkTextareaAutosize
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

  constructor() {
    this.initForm();
    this.setupEndDateToggle();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      company: [''],
      startDate: [''],
      endDate: [''],
      isCurrent: [false],
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
      this.experiences = state.experiences || [];
    });
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

    this.form.patchValue({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: isCurrentlyWorking
    });

    if (isCurrentlyWorking) {
      this.form.get('endDate')?.disable();
    } else {
      this.form.get('endDate')?.enable();
    }
    this.showForm = true;
  }

  saveExperience(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();
    const bulletValues = formValue.bullets.filter((b: string) => b && b.trim());

    const experience: Experience = {
      id: this.editingIndex !== null ? this.experiences[this.editingIndex].id : Date.now().toString(),
      title: formValue.title,
      company: formValue.company,
      startDate: formValue.startDate,
      endDate: formValue.isCurrent ? '' : formValue.endDate,
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
