import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule, CdkTextareaAutosize } from '@angular/cdk/text-field';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ThemeService } from '../../core/services/theme';
import { SelectionColorApplyComponent } from '../../shared/components/selection-color-apply/selection-color-apply.component';

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
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SelectionColorApplyComponent,
  ],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent {

  private fb = inject(FormBuilder);
  private store = inject(ResumeBuilderService);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  protected readonly theme = inject(ThemeService);

  @ViewChildren('bulletTextarea', { read: ElementRef })
  bulletTextareas!: QueryList<ElementRef<HTMLTextAreaElement>>;

  /** UI Signals */
  showForm = signal(false);
  editingIndex = signal<number | null>(null);

  /** Experience list derived from signal-based store */
  experiences = computed<Experience[]>(() => {
    return (this.store.state()?.experiences ?? []) as Experience[];
  });

  /** Build Form */
  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    company: ['', Validators.required],
    startDate: [null, Validators.required],
    endDate: [null],
    isCurrent: [false],
    bullets: this.fb.array([])
  });

  constructor() {
    const isCurrentCtrl = this.form.get('isCurrent');
    const endCtrl = this.form.get('endDate');
    if (!isCurrentCtrl || !endCtrl) return;

    const syncEndDateForCurrent = (isCurr: boolean | null | undefined) => {
      if (isCurr) {
        endCtrl.disable({ emitEvent: false });
        endCtrl.clearValidators();
        endCtrl.setValue(null, { emitEvent: false });
      } else {
        endCtrl.enable({ emitEvent: false });
        endCtrl.clearValidators();
      }
      endCtrl.updateValueAndValidity({ emitEvent: false });
    };

    isCurrentCtrl.valueChanges
      .pipe(startWith(isCurrentCtrl.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((isCurr) => syncEndDateForCurrent(isCurr as boolean));
  }

  /** Bullets getter */
  get bullets(): FormArray {
    return this.form.get('bullets') as FormArray;
  }

  /** UI Actions */
  showAddForm() {
    this.showForm.set(true);
    this.editingIndex.set(null);
    this.resetForm();
    this.addBullet();
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingIndex.set(null);
    this.resetForm();
  }

  /** Bullets */
  addBullet() {
    this.bullets.push(this.fb.control(''));
    afterNextRender(
      () => {
        const el = this.bulletTextareas?.last?.nativeElement;
        el?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  removeBullet(i: number) {
    this.bullets.removeAt(i);
  }

  onBulletDrop(event: CdkDragDrop<unknown>) {
    if (event.previousIndex === event.currentIndex) return;
    // FormArray has no reorder API — snapshot, re-seed, swap.
    const vals = this.bullets.controls.map((c) => c.value);
    moveItemInArray(vals, event.previousIndex, event.currentIndex);
    while (this.bullets.length) this.bullets.removeAt(0);
    for (const v of vals) this.bullets.push(this.fb.control(v));
  }

  /** Editing an Experience */
  editExperience(index: number) {
    const exp = this.experiences()[index];
    if (!exp) return;

    this.editingIndex.set(index);
    this.showForm.set(true);

    this.resetForm();

    // Load bullets
    exp.bullets.forEach(b => this.bullets.push(this.fb.control(b)));

    this.form.patchValue({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate ? new Date(exp.startDate) : null,
      endDate: exp.endDate ? new Date(exp.endDate) : null,
      isCurrent: exp.isCurrent
    });
  }

  /** Save Experience (new or update) */
  saveExperience() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const experience: Experience = {
      id:
        this.editingIndex() !== null
          ? this.experiences()[this.editingIndex()!].id
          : Date.now().toString(),

      title: raw.title,
      company: raw.company,
      startDate: raw.startDate instanceof Date
        ? raw.startDate.toISOString()
        : raw.startDate,

      endDate: raw.isCurrent
        ? ''
        : raw.endDate instanceof Date
          ? raw.endDate.toISOString()
          : raw.endDate ?? '',

      isCurrent: raw.isCurrent,
      bullets: raw.bullets
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 0)
    };

    const updated = [...this.experiences()];
    if (this.editingIndex() !== null) {
      updated[this.editingIndex()!] = experience;
    } else {
      updated.push(experience);
    }

    this.store.update({ experiences: updated });

    this.cancelForm();
  }

  onEntryDrop(event: CdkDragDrop<unknown>) {
    if (event.previousIndex === event.currentIndex) return;
    const next = [...this.experiences()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.store.update({ experiences: next });
  }

  /** Delete experience */
  deleteExperience(index: number) {
    this.store.update({
      experiences: this.experiences().filter((_, i) => i !== index)
    });
  }

  /** Reset form for new entry */
  private resetForm() {
    this.form.reset({
      title: '',
      company: '',
      startDate: null,
      endDate: null,
      isCurrent: false
    });

    while (this.bullets.length) this.bullets.removeAt(0);
  }
}
