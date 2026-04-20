import {
  Component,
  inject,
  signal,
  effect,
  computed,
  OnDestroy,
  untracked,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import type { BuilderTemplateId } from '../../shared/models/resume-builder.model';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MatCardModule],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnDestroy {
  private store = inject(ResumeBuilderService);
  private dialogRef = inject(MatDialogRef<PreviewComponent>);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

  private readonly tpl: BuilderTemplateId = 'modern';

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private data = inject<{ resumeId: string }>(MAT_DIALOG_DATA);
  resumeId = signal(this.data.resumeId);

  pdfUrl = signal<SafeResourceUrl | null>(null);
  isLoading = signal(true);
  showEmptyState = signal(false);
  zoom = signal(1.0);

  zoomPercent = computed(() => `${Math.round(this.zoom() * 100)}%`);

  constructor() {
    effect(() => {
      this.resumeId();
      untracked(() => this.loadPdfPreview());
    });
  }

  private getFullScreenDialogConfig(data?: unknown): MatDialogConfig {
    return {
      panelClass: 'responsive-dialog-wrapper',
      maxWidth: '100vw',
      width: '100%',
      height: '100%',
      disableClose: true,
      data,
    };
  }

  private openTemplateUpgrade(message: string): void {
    const ref = this.dialog.open(QuotaExhaustedModal, this.getFullScreenDialogConfig({ message }));
    ref.afterClosed().subscribe((r) => {
      if (r === 'upgrade') {
        this.dialog.open(UpgradePro, this.getFullScreenDialogConfig());
      }
    });
  }

  private loadPdfPreview() {
    this.isLoading.set(true);
    this.showEmptyState.set(false);
    this.zoom.set(1);

    this.pdfUrl.set(null);

    const id = this.resumeId();
    if (!id) {
      this.showEmptyState.set(true);
      this.isLoading.set(false);
      return;
    }

    this.store.exportPdf(this.tpl, id).subscribe({
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
      error: (err: { status?: number; error?: { message?: string } }) => {
        this.isLoading.set(false);
        if (err?.status === 403) {
          const message =
            err.error?.message ||
            'PDF export is not available on your current plan. Upgrade to export your resume.';
          this.openTemplateUpgrade(message);
          this.showEmptyState.set(false);
          return;
        }
        this.showEmptyState.set(true);
      },
    });
  }

  zoomIn() {
    this.zoom.update((v) => Math.min(v + 0.1, 3));
  }
  zoomOut() {
    this.zoom.update((v) => Math.max(v - 0.1, 0.3));
  }
  resetZoom() {
    this.zoom.set(1.0);
  }

  downloadPDF() {
    if (!this.isBrowser()) return;

    this.store.exportPdf(this.tpl, this.resumeId()).subscribe({
      next: (blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `resume-${this.tpl}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Download failed:', e);
        }
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        if (err?.status === 403) {
          const message =
            err.error?.message ||
            'PDF export is not available on your current plan. Upgrade to export your resume.';
          this.openTemplateUpgrade(message);
        }
      },
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {}
}
