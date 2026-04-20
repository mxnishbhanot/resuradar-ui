import { Component, Input, OnDestroy, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ColorChromeModule } from 'ngx-color/chrome';
import type { ColorEvent } from 'ngx-color';
import { wrapTextareaSelection } from '../../utils/wrap-textarea-selection';

export type TextFieldWithSelection = HTMLTextAreaElement | HTMLInputElement;

@Component({
  selector: 'rr-selection-color-apply',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ColorChromeModule,
  ],
  templateUrl: './selection-color-apply.component.html',
  styleUrl: './selection-color-apply.component.scss',
})
export class SelectionColorApplyComponent implements OnDestroy {
  /** Input or textarea bound to the same `FormControl` as `control`. */
  @Input({ required: true }) set textFieldEl(el: TextFieldWithSelection | null) {
    this.detachListeners();
    this._el = el;
    if (el) {
      this.boundRefresh = () => this.refreshSelection();
      el.addEventListener('mouseup', this.boundRefresh);
      el.addEventListener('keyup', this.boundRefresh);
      el.addEventListener('select', this.boundRefresh);
    }
    this.refreshSelection();
  }

  @Input({ required: true }) control!: FormControl<string>;

  chromeColor = signal('#2563eb');
  canApply = signal(false);
  private selStart = 0;
  private selEnd = 0;
  private _el: TextFieldWithSelection | null = null;
  private boundRefresh: (() => void) | null = null;

  ngOnDestroy(): void {
    this.detachListeners();
  }

  private detachListeners(): void {
    if (this._el && this.boundRefresh) {
      this._el.removeEventListener('mouseup', this.boundRefresh);
      this._el.removeEventListener('keyup', this.boundRefresh);
      this._el.removeEventListener('select', this.boundRefresh);
    }
    this._el = null;
    this.boundRefresh = null;
  }

  private refreshSelection(): void {
    const el = this._el;
    if (!el) {
      this.canApply.set(false);
      return;
    }
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    this.selStart = s;
    this.selEnd = e;
    this.canApply.set(e > s);
  }

  onChromeComplete(ev: ColorEvent): void {
    const hex = ev.color?.hex;
    if (!hex || !this._el || !this.control) return;
    const raw = this.control.value ?? '';
    const wrapped = wrapTextareaSelection(raw, this.selStart, this.selEnd, hex);
    if (!wrapped) return;
    this.control.setValue(wrapped.value);
    this.control.markAsDirty();
    const el = this._el;
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(wrapped.caret, wrapped.caret);
      this.refreshSelection();
    });
  }
}
