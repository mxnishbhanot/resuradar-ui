import {
  Component,
  inject,
  signal,
  effect,
  computed,
  OnDestroy,
  untracked,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type Template = 'modern' | 'corporate' | 'minimal';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnDestroy {

  private store = inject(ResumeBuilderService);
  private dialogRef = inject(MatDialogRef<PreviewComponent>);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);

  /** SSR-Safe Browser Check */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Dialog data */
  private data = inject<{ resumeId: string }>(MAT_DIALOG_DATA);
  resumeId = signal(this.data.resumeId);

  // UI State
  currentTemplate = signal<Template>('modern');
  pdfUrl = signal<SafeResourceUrl | null>(null); // FIXED TYPE
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
      untracked(() => this.loadPdfPreview(template));
    });
  }

  // ----------------------------------------------------------
  // LOAD PDF PREVIEW (SSR-SAFE + SANITIZED URL)
  // ----------------------------------------------------------
  private loadPdfPreview(template: Template) {
    this.isLoading.set(true);
    this.showEmptyState.set(false);
    this.zoom.set(1);

    if (this.isBrowser() && this.pdfUrl()) {
      try {
        // We cannot revoke SafeResourceUrl — only raw blobs.
      } catch {}
    }

    this.pdfUrl.set(null);

    const id = this.resumeId();
    if (!id) {
      this.showEmptyState.set(true);
      this.isLoading.set(false);
      return;
    }

    this.store.exportPdf(template, id).subscribe({
      next: (blob) => {
        if (!this.isBrowser()) {
          this.showEmptyState.set(true);
          this.isLoading.set(false);
          return;
        }

        if (blob.size === 0) {
          this.showEmptyState.set(true);
        } else {
          const raw = URL.createObjectURL(blob);
          const trusted = this.sanitizer.bypassSecurityTrustResourceUrl(raw);
          this.pdfUrl.set(trusted);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.showEmptyState.set(true);
        this.isLoading.set(false);
      }
    });
  }

  // ----------------------------------------------------------
  // ZOOM CONTROLS
  // ----------------------------------------------------------
  zoomIn() { this.zoom.update(v => Math.min(v + 0.1, 3)); }
  zoomOut() { this.zoom.update(v => Math.max(v - 0.1, 0.3)); }
  resetZoom() { this.zoom.set(1.0); }

  // ----------------------------------------------------------
  // DOWNLOAD (SSR-SAFE)
  // ----------------------------------------------------------
  downloadPDF() {
    if (!this.isBrowser()) return;

    this.store.exportPdf(this.currentTemplate(), this.resumeId()).subscribe(blob => {
      try {
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${this.currentTemplate()}.pdf`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Download failed:', e);
      }
    });
  }

  // ----------------------------------------------------------
  // CLOSE
  // ----------------------------------------------------------
  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    // Nothing to revoke because SafeResourceUrl is not raw blob URLs.
  }
}
