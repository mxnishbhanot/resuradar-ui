import { Component, inject, signal, effect } from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatChipsModule,
  MatChipInputEvent,
  MatChipEditedEvent
} from '@angular/material/chips';

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
export class SkillsComponent {

  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);

  // ► SIGNAL STATE
  skillCategories = signal<SkillCategory[]>([]);
  showForm = signal(false);
  editingIndex = signal<number | null>(null);

  // CHIPS
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    skills: this.fb.array([])
  });

  constructor() {

    // Auto-sync service state → local signal
    effect(() => {
      const state = this.store.state();
      this.skillCategories.set(state.skills ?? []);
    });
  }

  // ---- FORM HELPERS ----

  skillsArray(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  skillsControls(): FormControl[] {
    return this.skillsArray().controls as FormControl[];
  }

  // ---- UI ACTIONS ----

  showAddForm(): void {
    this.showForm.set(true);
    this.editingIndex.set(null);
    this.form.reset();
    this.skillsArray().clear();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingIndex.set(null);
    this.form.reset();
    this.skillsArray().clear();
  }

  // Chips add
  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.skillsArray().push(new FormControl(value));
    }
    event.chipInput?.clear();
  }

  removeSkill(index: number): void {
    this.skillsArray().removeAt(index);
  }

  editSkill(index: number, event: MatChipEditedEvent): void {
    const value = event.value.trim();
    if (!value) {
      this.removeSkill(index);
    } else {
      this.skillsControls()[index].setValue(value);
    }
  }

  // Editing an existing category
  editCategory(index: number): void {
    const category = this.skillCategories()[index];

    this.editingIndex.set(index);
    this.showForm.set(true);

    this.form.patchValue({ name: category.name });

    this.skillsArray().clear();
    category.skills.forEach(skill => {
      this.skillsArray().push(new FormControl(skill));
    });
  }

  saveCategory(): void {
    if (this.form.invalid || this.skillsArray().length === 0) return;

    const formValue = this.form.getRawValue();
    const cleanedSkills = formValue.skills.map((s: string) => s.trim()).filter(Boolean);

    const index = this.editingIndex();
    const id = index !== null ? this.skillCategories()[index].id : Date.now().toString();

    const newCategory: SkillCategory = {
      id,
      name: formValue.name,
      skills: cleanedSkills
    };

    const updated = [...this.skillCategories()];

    if (index !== null) {
      updated[index] = newCategory;
    } else {
      updated.push(newCategory);
    }

    this.store.update({ skills: updated });
    this.cancelForm();
  }

  deleteCategory(index: number): void {
    const updated = this.skillCategories().filter((_, i) => i !== index);
    this.store.update({ skills: updated });
  }

}
