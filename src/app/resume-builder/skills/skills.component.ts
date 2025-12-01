import { Component, OnInit, inject } from '@angular/core';  // CHANGED: Added inject import
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule, MatChipInputEvent, MatChipEditedEvent } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { SkillCategory } from '../../shared/models/resume-builder.model';  // CHANGED: Import from model

@Component({
  selector: 'rr-skills',
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
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
})
export class SkillsComponent implements OnInit {
  // Key codes for adding chips
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  form!: FormGroup;
  showForm = false;
  editingIndex: number | null = null;
  skillCategories: SkillCategory[] = [];  // CHANGED: Typed to SkillCategory[]

  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);  // CHANGED: Use inject() for standalone

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    // CHANGED: Typed to SkillCategory[]
    this.store.state$.subscribe(state => {
       this.skillCategories = state.skills || [];
    });
  }

  // Initialize the reactive form
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      // Using FormArray to manage the list of skills strings
      skills: this.fb.array([], Validators.required)
    });
  }

  // Getter for easier access to the FormArray controls in template
  get skillsArray(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  get skillsControls(): FormControl[] {
    return this.skillsArray.controls as FormControl[];
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

  // === Chip Management Functions ===

  // Add a skill chip when Enter/Comma is pressed
  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    // Add our skill if it has a value
    if (value) {
      this.skillsArray.push(this.fb.control(value));
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  // Remove a skill chip
  removeSkill(index: number): void {
    this.skillsArray.removeAt(index);
  }

  // Optional: Allow editing existing chips by double-clicking them
  editSkill(index: number, event: MatChipEditedEvent): void {
    const value = event.value.trim();
    // Remove skill if it's empty
    if (!value) {
      this.removeSkill(index);
      return;
    }

    // Update existing skill
    this.skillsControls[index].setValue(value);
  }

  // === Category CRUD ===

  editCategory(index: number): void {
    this.editingIndex = index;
    const category = this.skillCategories[index];

    // Clear existing form array before patching
    this.skillsArray.clear();
    // Populate form array with existing skills
    if (category.skills && category.skills.length > 0) {
      category.skills.forEach((skillName: string) => {  // CHANGED: Typed as string
        this.skillsArray.push(this.fb.control(skillName));
      });
    }

    this.form.patchValue({
      name: category.name
    });

    this.showForm = true;
  }

  deleteCategory(index: number): void {
    // In a real app, you might want a confirmation dialog here
    const updatedCategories = [...this.skillCategories];
    updatedCategories.splice(index, 1);
    // Update store
    this.store.update({ skills: updatedCategories });  // Triggers autosave
  }

  saveCategory(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const categoryData: SkillCategory = {
      id: this.editingIndex !== null ?
        this.skillCategories[this.editingIndex].id : Date.now().toString(),
      name: formValue.name,
      // Filter out any potentially empty strings just in case
      skills: formValue.skills.filter((s: string) => s && s.trim())
    };
    let updatedCategories = [...this.skillCategories];

    if (this.editingIndex !== null) {
      // Update existing
      updatedCategories[this.editingIndex] = categoryData;
    } else {
      // Add new
      updatedCategories.push(categoryData);
    }

    // Send to store
    this.store.update({ skills: updatedCategories });  // Triggers autosave
    // Reset UI
    this.cancelForm();
  }
}
