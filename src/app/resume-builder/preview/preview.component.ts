import {
  Component,
  inject,
  signal,
  effect,
  computed,
  OnDestroy,
  untracked
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'; // ← Add MAT_DIALOG_DATA

import { ResumeBuilderService } from '../../core/services/resume-builder.service';

type Template = 'modern' | 'corporate' | 'minimal';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [
    FormsModule,
    PdfViewerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule
],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
})
export class PreviewComponent implements OnDestroy {
  private store = inject(ResumeBuilderService);
  private dialogRef = inject(MatDialogRef<PreviewComponent>); // Optional: for direct close

  // Inject typed dialog data (modern + safe)
  private data = inject<{ resumeId: string }>(MAT_DIALOG_DATA);

  // Now derive a signal from data (handles null safely if needed)
  resumeId = signal(this.data.resumeId); // ← Use this everywhere instead of input()

  currentTemplate = signal<Template>('modern');
  pdfUrl = signal<string | null>(null);
  isLoading = signal(true);
  showEmptyState = signal(false);
  zoom = signal(1.0);

  templates = signal([
    { label: 'Corporate', value: 'corporate' },
    { label: 'Modern', value: 'modern' },
    { label: 'Minimalist', value: 'minimal' },
  ] as const);

  zoomPercent = computed(() => `${Math.round(this.zoom() * 100)}%`);

constructor() {
  effect(() => {
    const template = this.currentTemplate();

    untracked(() => {
      this.loadPdfPreview(template);
    });
  });
}

  private loadPdfPreview(template: Template) {
    this.isLoading.set(true);
    this.showEmptyState.set(false);
    this.zoom.set(1.0);

    if (this.pdfUrl()) {
      URL.revokeObjectURL(this.pdfUrl()!);
      this.pdfUrl.set(null);
    }

    const id = this.resumeId(); // ← Now a signal
    if (!id) {
      this.showEmptyState.set(true);
      this.isLoading.set(false);
      return;
    }

    this.store.exportPdf(template, id).subscribe({
      next: (blob) => {
        if (blob.size === 0) {
          this.showEmptyState.set(true);
        } else {
          this.pdfUrl.set(URL.createObjectURL(blob));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.showEmptyState.set(true);
        this.isLoading.set(false);
      },
    });
  }

  zoomIn() { this.zoom.update(v => Math.min(v + 0.1, 3)); }
  zoomOut() { this.zoom.update(v => Math.max(v - 0.1, 0.3)); }
  resetZoom() { this.zoom.set(1.0); }

  onPDFLoaded() {
    setTimeout(() => this.isLoading.set(false), 100);
  }

  downloadPDF() {
    this.store.exportPdf(this.currentTemplate(), this.resumeId()).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${this.currentTemplate()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  close() {
    if (this.pdfUrl()) URL.revokeObjectURL(this.pdfUrl()!);
    this.dialogRef.close(); // ← Clean close
  }

  ngOnDestroy() {
    if (this.pdfUrl()) URL.revokeObjectURL(this.pdfUrl()!);
  }
}
