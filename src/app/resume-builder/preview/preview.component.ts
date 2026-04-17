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
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { UserService } from '../../core/services/user';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';

type Template = 'modern' | 'corporate' | 'minimal' | 'faang' | 'luxury' | 'magazine' | 'executive' | 'creative';

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
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private data = inject<{ resumeId: string }>(MAT_DIALOG_DATA);
  resumeId = signal(this.data.resumeId);

  currentTemplate = signal<Template>('modern');
  pdfUrl = signal<SafeResourceUrl | null>(null);
  isLoading = signal(true);
  showEmptyState = signal(false);
  zoom = signal(1.0);

  private readonly allTemplates: ReadonlyArray<{ label: string; value: Template }> = [
    { label: 'Corporate', value: 'corporate' },
    { label: 'Modern', value: 'modern' },
    { label: 'Minimalist', value: 'minimal' },
    { label: 'FAANG', value: 'faang' },
    { label: 'Luxury', value: 'luxury' },
    { label: 'Magazine', value: 'magazine' },
    { label: 'Executive', value: 'executive' },
    { label: 'Creative', value: 'creative' },
  ];

  templates = computed(() => {
    if (this.userService.isProUser()) {
      return [...this.allTemplates];
    }
    const free = new Set(
      this.userService.user()?.freeBuilderTemplates?.length
        ? this.userService.user()!.freeBuilderTemplates!
        : ['modern', 'corporate', 'minimal']
    );
    return this.allTemplates.filter((t) => free.has(t.value));
  });

  zoomPercent = computed(() => `${Math.round(this.zoom() * 100)}%`);

  constructor() {
    if (this.isBrowser()) {
      this.userService.fetchCurrentUser().subscribe();
    }

    effect(() => {
      const opts = this.templates();
      const cur = this.currentTemplate();
      if (opts.length && !opts.some((o) => o.value === cur)) {
        this.currentTemplate.set(opts[0].value);
      }
    });

    effect(() => {
      const template = this.currentTemplate();
      untracked(() => this.loadPdfPreview(template));
    });
  }

  private getFullScreenDialogConfig(data?: any): MatDialogConfig {
    return {
      panelClass: 'responsive-dialog-wrapper',
      maxWidth: '100vw',
      width: '100%',
      height: '100%',
      disableClose: true,
      data
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

  private loadPdfPreview(template: Template) {
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
      error: (err: any) => {
        this.isLoading.set(false);
        if (err?.status === 403) {
          const message =
            err.error?.message ||
            'This template is available on Pro. Upgrade to unlock all templates and premium PDF exports.';
          this.openTemplateUpgrade(message);
          this.showEmptyState.set(false);
          return;
        }
        this.showEmptyState.set(true);
      }
    });
  }

  zoomIn() { this.zoom.update(v => Math.min(v + 0.1, 3)); }
  zoomOut() { this.zoom.update(v => Math.max(v - 0.1, 0.3)); }
  resetZoom() { this.zoom.set(1.0); }

  downloadPDF() {
    if (!this.isBrowser()) return;

    this.store.exportPdf(this.currentTemplate(), this.resumeId()).subscribe({
      next: (blob) => {
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
      },
      error: (err: any) => {
        if (err?.status === 403) {
          const message =
            err.error?.message ||
            'This template is available on Pro. Upgrade to unlock all templates and premium PDF exports.';
          this.openTemplateUpgrade(message);
        }
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
  }
}
