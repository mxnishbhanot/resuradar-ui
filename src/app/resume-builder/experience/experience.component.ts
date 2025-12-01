import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Experience } from '../../shared/models/resume-builder.model';  // CHANGED: Import from model

@Component({
  selector: 'rr-experience',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
})
export class ExperienceComponent implements OnInit {
  form: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  experiences: Experience[] = [];
  isGenerating = false;

  constructor(
    private fb: FormBuilder,
    private store: ResumeBuilderService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      company: [''],
      startDate: [''],
      endDate: [''],
      isCurrent: [false],
      bullets: this.fb.array([])
    });

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
    this.addBullet(); // Start with one empty bullet point
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
      exp.bullets.forEach((bullet: string) => {  // CHANGED: Typed as string
        this.bullets.push(this.fb.control(bullet));
      });
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

    // Manually ensure controls are enabled/disabled based on the patched value
    if (isCurrentlyWorking) {
      this.form.get('endDate')?.disable();
    } else {
      this.form.get('endDate')?.enable();
    }

    this.showForm = true;
  }

  saveExperience(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue(); // Use getRawValue to include disabled endDate if necessary
    // Filter out empty bullet points before saving
    const bulletValues = formValue.bullets.filter((b: string) => b && b.trim());

    const experience: Experience = {
      id: this.editingIndex !== null ? this.experiences[this.editingIndex].id : Date.now().toString(),
      title: formValue.title,
      company: formValue.company,
      startDate: formValue.startDate,
      // If isCurrent is true, set endDate to an empty string on the model
      endDate: formValue.isCurrent ? '' : formValue.endDate,
      isCurrent: formValue.isCurrent,
      bullets: bulletValues
    };

    let updatedExperiences: Experience[];
    if (this.editingIndex !== null) {
      updatedExperiences = [...this.experiences];
      updatedExperiences[this.editingIndex] = experience;
    } else {
      updatedExperiences = [...this.experiences, experience];
    }

    // CHANGED: Use update() instead of replace() to trigger autosave consistently
    this.store.update({ experiences: updatedExperiences });

    this.cancelForm();
  }

  deleteExperience(index: number): void {
    const updatedExperiences = this.experiences.filter((_, i) => i !== index);
    // CHANGED: Use update() instead of replace()
    this.store.update({ experiences: updatedExperiences });
  }

  // --- AI Generation Logic ---
  generateBulletsWithAI(): void {
    const title = this.form.get('title')?.value;
    const company = this.form.get('company')?.value;

    // Title is required to generate useful bullets
    if (!title) {
      return;
    }

    this.isGenerating = true;
    const ctx = {
      personal: this.store.snapshot.personal,
      title,
      company
    };

    // Simulating API call
    // Replace with actual API service call
    const mockResponse = {
        bullets: [
            "Developed and maintained a high-traffic microservice architecture using Node.js and AWS Lambda, improving response time by 15%.",
            "Led a team of 4 junior developers in daily stand-ups and code reviews, ensuring adherence to coding standards and best practices.",
            "Optimized CI/CD pipelines with Jenkins, reducing deployment time from 30 minutes to under 5 minutes.",
            "Collaborated cross-functionally with product managers and UX/UI designers to deliver features on schedule."
        ]
    };

    setTimeout(() => {
      this.isGenerating = false;

      const res = mockResponse; // Use the mock response

      if (res?.bullets && Array.isArray(res.bullets)) {
        this.bullets.clear();
        res.bullets.forEach((bullet: string) => {
          this.bullets.push(this.fb.control(bullet));
        });
        // CHANGED: Form changes now trigger autosave via state$
      }
    }, 1500); // Simulate API delay
  }
}
