import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { Education } from '../../shared/models/resume-builder.model';

@Component({
  selector: 'rr-education',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule, // Kept for clarity, although often handled implicitly
    MatInputModule,     // Kept for clarity
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule
  ],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
})
export class EducationComponent implements OnInit {
  form: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  educations: Education[] = [];

  constructor(
    private fb: FormBuilder,
    private store: ResumeBuilderService
  ) {
    this.form = this.fb.group({
      school: ['', Validators.required],
      degree: [''],
      field: [''],
      startYear: [''],
      endYear: [''],
      isCurrent: [false],
      description: ['']
    });

    // Disable endYear when isCurrent is checked
    this.form.get('isCurrent')?.valueChanges.subscribe(isCurrent => {
      const endYearControl = this.form.get('endYear');
      if (isCurrent) {
        endYearControl?.setValue('');
        endYearControl?.disable();
      } else {
        endYearControl?.enable();
      }
    });
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.educations = state.educations || [];
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    // Reset form and explicitly set isCurrent to false
    this.form.reset({ isCurrent: false });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    // Reset form and explicitly set isCurrent to false
    this.form.reset({ isCurrent: false });
  }

  editEducation(index: number): void {
    this.editingIndex = index;
    const edu = this.educations[index];

    // Check if endYear is empty to determine isCurrent status
    const isCurrentlyStudying = !edu.endYear;

    this.form.patchValue({
      school: edu.school,
      degree: edu.degree,
      field: edu.field,
      startYear: edu.startYear,
      // If currently studying, pass the actual value (empty string) to patchValue
      endYear: edu.endYear,
      isCurrent: isCurrentlyStudying,
      description: edu.description
    });

    // Manually ensure controls are enabled/disabled based on the patched value
    if (isCurrentlyStudying) {
      this.form.get('endYear')?.disable();
    } else {
      this.form.get('endYear')?.enable();
    }

    this.showForm = true;
  }

  saveEducation(): void {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue(); // Use getRawValue to include disabled fields if needed, though endYear logic handles it.

    const education: Education = {
      id: this.editingIndex !== null ? this.educations[this.editingIndex].id : Date.now().toString(),
      school: formValue.school,
      degree: formValue.degree,
      field: formValue.field,
      startYear: formValue.startYear,
      // If isCurrent is true, set endYear to an empty string on the model
      endYear: formValue.isCurrent ? '' : formValue.endYear,
      description: formValue.description
    };

    let updatedEducations: Education[];
    if (this.editingIndex !== null) {
      updatedEducations = [...this.educations];
      updatedEducations[this.editingIndex] = education;
    } else {
      updatedEducations = [...this.educations, education];
    }

    this.store.replace({
      ...this.store.snapshot,
      educations: updatedEducations
    });

    this.cancelForm();
  }

  deleteEducation(index: number): void {
    const updatedEducations = this.educations.filter((_, i) => i !== index);
    this.store.replace({
      ...this.store.snapshot,
      educations: updatedEducations
    });
  }
}
