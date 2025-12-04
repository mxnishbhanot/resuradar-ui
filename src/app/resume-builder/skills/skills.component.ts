import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule, MatChipInputEvent, MatChipEditedEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

@Component({
  selector: 'rr-skills',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
})
export class SkillsComponent implements OnInit {
  form!: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  skillCategories: SkillCategory[] = [];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      skills: this.fb.array([])
    });
  }

  get skillsArray(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  get skillsControls(): FormControl[] {
    return this.skillsArray.controls as FormControl[];
  }

  ngOnInit(): void {
    this.store.state$.subscribe(state => {
      this.skillCategories = state.skills || [];
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingIndex = null;
    this.form.reset();
    this.skillsArray.clear();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.form.reset();
    this.skillsArray.clear();
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && this.skillsArray.length < 15) { // Example: Limit to 15 skills per category
      this.skillsArray.push(this.fb.control(value));
    }
    event.chipInput!.clear();
  }

  removeSkill(index: number): void {
    this.skillsArray.removeAt(index);
  }

  editSkill(index: number, event: MatChipEditedEvent): void {
    const value = event.value.trim();
    if (!value) {
      this.removeSkill(index);
      return;
    }
    this.skillsControls[index].setValue(value);
  }

  editCategory(index: number): void {
    this.editingIndex = index;
    const category = this.skillCategories[index];

    this.skillsArray.clear();
    if (category.skills && category.skills.length > 0) {
      category.skills.forEach(skill => this.skillsArray.push(this.fb.control(skill)));
    }

    this.form.patchValue({
      name: category.name
    });
    this.showForm = true;
  }

  saveCategory(): void {
    if (this.form.invalid || this.skillsArray.length === 0) return;

    const formValue = this.form.getRawValue();
    const filteredSkills = formValue.skills.filter((s: string) => s && s.trim());

    const category: SkillCategory = {
      id: this.editingIndex !== null ? this.skillCategories[this.editingIndex].id : Date.now().toString(),
      name: formValue.name,
      skills: filteredSkills
    };

    let updatedCategories = [...this.skillCategories];
    if (this.editingIndex !== null) {
      updatedCategories[this.editingIndex] = category;
    } else {
      updatedCategories.push(category);
    }

    this.store.update({ skills: updatedCategories });
    this.cancelForm();
  }

  deleteCategory(index: number): void {
    const updatedCategories = this.skillCategories.filter((_, i) => i !== index);
    this.store.update({ skills: updatedCategories });
  }
}
