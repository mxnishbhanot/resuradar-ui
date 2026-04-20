import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ColorChromeModule } from 'ngx-color/chrome';
import type { ColorEvent } from 'ngx-color';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ToastService } from '../../core/services/toast';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../../components/upgrade-pro/upgrade-pro';
import { CONTENT_HEIGHT_MM, CONTENT_WIDTH_MM, mmToPx } from '../../shared/constants/print-spec';
import {
  type BuilderTemplateId,
  type TemplateAppearance,
  type TemplateSectionKey,
  normalizeTemplateSettings,
} from '../../shared/models/resume-builder.model';
import { STANDARD_RESUME_COLORS } from '../../shared/constants/print-spec';

const SECTION_LABELS: Record<TemplateSectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
};

function mapFieldToTab(field: string | null | undefined): number | null {
  if (!field) return null;
  if (field === 'personal.summary') return 5;
  if (field === 'section.education') return 1;
  if (field === 'section.experience' || field.startsWith('experiences.')) return 2;
  if (field === 'section.projects') return 3;
  if (field === 'section.skills') return 4;
  return 0;
}

@Component({
  selector: 'rr-template-designer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatMenuModule,
    ColorChromeModule,
  ],
  templateUrl: './template-designer.component.html',
  styleUrls: ['./template-designer.component.scss'],
})
export class TemplateDesignerComponent implements OnInit, OnDestroy {
  private store = inject(ResumeBuilderService);
  private dialogRef = inject(MatDialogRef<TemplateDesignerComponent>);
  private data = inject<{ resumeId: string | null }>(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  private previewResizeObserver: ResizeObserver | null = null;
  /** Deferred flush so layout writes never run in the same turn as ResizeObserver delivery. */
  private previewLayoutFlushTimer: ReturnType<typeof setTimeout> | null = null;

  previewFrame = viewChild<ElementRef<HTMLIFrameElement>>('previewFrame');

  /** Matches PDF printable width (`print-spec` / Playwright margins). */
  readonly contentWidthMm = CONTENT_WIDTH_MM;

  resumeId = signal(this.data.resumeId);
  /** Single standard layout — kept for API compatibility with `renderPreviewHtml` / `exportPdf`. */
  private readonly tpl: BuilderTemplateId = 'modern';
  isLoading = signal(false);
  iframeUrl = signal<SafeResourceUrl | null>(null);
  overlayHeightPx = signal(0);

  private blobUrls: string[] = [];
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private onWinMessage = (ev: MessageEvent) => this.handlePreviewMessage(ev);

  sectionOrder = computed(() => {
    const t = this.tpl;
    return normalizeTemplateSettings(t, this.store.state().templateSettings).sectionOrder!;
  });

  layoutScale = computed(
    () =>
      normalizeTemplateSettings(this.tpl, this.store.state().templateSettings).layout!
        .globalScale!
  );
  sectionGap = computed(
    () =>
      normalizeTemplateSettings(this.tpl, this.store.state().templateSettings).layout!
        .sectionGap!
  );
  lineHeight = computed(
    () =>
      normalizeTemplateSettings(this.tpl, this.store.state().templateSettings).layout!
        .lineHeight!
  );

  scalePct = computed(() => `${Math.round(this.layoutScale() * 100)}%`);
  gapPct = computed(() => `${Math.round(this.sectionGap() * 100)}%`);
  lineHeightPct = computed(() => `${Math.round(this.lineHeight() * 100)}%`);

  appearance = computed(() =>
    normalizeTemplateSettings(this.tpl, this.store.state().templateSettings).appearance!
  );

  bodyColorPicker = computed(() => {
    const a = this.appearance();
    const t = a.colorMode === 'dark' ? STANDARD_RESUME_COLORS.dark : STANDARD_RESUME_COLORS.light;
    return a.bodyColor ?? t.ink;
  });

  headingColorPicker = computed(() => {
    const a = this.appearance();
    const t = a.colorMode === 'dark' ? STANDARD_RESUME_COLORS.dark : STANDARD_RESUME_COLORS.light;
    return a.headingColor ?? t.heading;
  });

  pageLineTopsPx = computed(() => {
    const h = this.overlayHeightPx();
    const ph = mmToPx(CONTENT_HEIGHT_MM);
    if (ph <= 0 || h <= 0) return [];
    const lines: number[] = [];
    for (let y = ph; y < h - 0.5; y += ph) {
      lines.push(y);
    }
    return lines;
  });

  constructor() {
    effect(() => {
      this.store.state();
      untracked(() => this.scheduleRefresh());
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('message', this.onWinMessage);
    }
  }

  ngOnDestroy(): void {
    if (this.previewLayoutFlushTimer != null) {
      clearTimeout(this.previewLayoutFlushTimer);
      this.previewLayoutFlushTimer = null;
    }
    this.previewResizeObserver?.disconnect();
    this.previewResizeObserver = null;
    this.revokeBlobs();
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('message', this.onWinMessage);
    }
  }

  private handlePreviewMessage(ev: MessageEvent): void {
    if (ev.data?.type !== 'rr-field-click') return;
    const tab = mapFieldToTab(ev.data.field as string);
    if (tab != null) {
      this.dialogRef.close({ navigateTab: tab });
    }
  }

  sectionLabel(k: TemplateSectionKey): string {
    return SECTION_LABELS[k] ?? k;
  }

  close(): void {
    this.dialogRef.close();
  }

  onSectionDrop(event: CdkDragDrop<TemplateSectionKey[]>): void {
    const order = [...this.sectionOrder()];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    const t = this.tpl;
    this.store.update({
      templateSettings: normalizeTemplateSettings(t, {
        ...this.store.snapshot.templateSettings,
        sectionOrder: order,
      }),
    });
  }

  onScaleChange(v: number): void {
    this.patchLayout({ globalScale: v });
  }

  onGapChange(v: number): void {
    this.patchLayout({ sectionGap: v });
  }

  onLineHeightChange(v: number): void {
    this.patchLayout({ lineHeight: v });
  }

  private patchLayout(partial: { globalScale?: number; sectionGap?: number; lineHeight?: number }): void {
    const t = this.tpl;
    const cur = this.store.snapshot.templateSettings;
    const L = { ...cur?.layout, ...partial, layoutVersion: 1 as const };
    this.store.update({
      templateSettings: normalizeTemplateSettings(t, { ...cur, layout: L }),
    });
  }

  onColorModeChange(mode: string): void {
    this.patchAppearance({ colorMode: mode === 'dark' ? 'dark' : 'light' });
  }

  onHeadingWeightChange(w: number): void {
    const wn = w === 600 || w === 700 || w === 800 ? w : 700;
    this.patchAppearance({ headingWeight: wn as TemplateAppearance['headingWeight'] });
  }

  onUnderlineLinksChange(checked: boolean): void {
    this.patchAppearance({ underlineLinks: checked });
  }

  onBodyColorPick(hex: string): void {
    this.patchAppearance({ bodyColor: hex || null });
  }

  onHeadingColorPick(hex: string): void {
    this.patchAppearance({ headingColor: hex || null });
  }

  onBodyChromeComplete(ev: ColorEvent): void {
    const raw = ev.color?.hex;
    if (!raw) return;
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    this.onBodyColorPick(hex);
  }

  onHeadingChromeComplete(ev: ColorEvent): void {
    const raw = ev.color?.hex;
    if (!raw) return;
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    this.onHeadingColorPick(hex);
  }

  resetBodyColor(): void {
    this.patchAppearance({ bodyColor: null });
  }

  resetHeadingColor(): void {
    this.patchAppearance({ headingColor: null });
  }

  private patchAppearance(partial: Partial<TemplateAppearance>): void {
    const t = this.tpl;
    const cur = this.store.snapshot.templateSettings;
    const merged = { ...(cur?.appearance || {}), ...partial };
    this.store.update({
      templateSettings: normalizeTemplateSettings(t, { ...cur, appearance: merged }),
    });
  }

  downloadPdf(): void {
    const id = this.resumeId();
    if (!isPlatformBrowser(this.platformId) || !id) return;

    this.store.exportPdf(this.tpl, id).subscribe({
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
          console.error(e);
        }
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        if (err?.status === 403) {
          this.openUpgrade(err.error?.message);
        } else {
          this.toast.show('error', 'Export failed', 'Could not generate PDF.', 6000);
        }
      },
    });
  }

  autoAdjust(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const maxPages = 2;
    const pageH = mmToPx(CONTENT_HEIGHT_MM);

    const tryMeasure = () => {
      const frame = this.previewFrame()?.nativeElement;
      const body = frame?.contentDocument?.body;
      if (!body) return null;
      let lo = 0.65;
      let hi = 1.25;
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        body.style.zoom = String(mid);
        const sh = body.scrollHeight;
        const pages = Math.ceil(sh / pageH);
        if (pages <= maxPages) lo = mid;
        else hi = mid;
      }
      body.style.zoom = '';
      return lo;
    };

    this.isLoading.set(true);
    this.store
      .renderPreviewHtml(this.tpl, this.store.snapshot)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (html) => {
          this.applyHtmlBlob(html);
          setTimeout(() => {
            const best = tryMeasure();
            if (best != null) {
              this.patchLayout({ globalScale: best });
              this.toast.show('success', 'Auto-adjust', 'Scale updated to better fit pages.', 4000);
            } else {
              this.toast.show('error', 'Auto-adjust', 'Preview not ready yet.', 4000);
            }
            this.isLoading.set(false);
            this.scheduleRefresh(0);
          }, 300);
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.isLoading.set(false);
          if (err?.status === 403) this.openUpgrade(err.error?.message);
          else this.toast.show('error', 'Auto-adjust', 'Could not load preview.', 5000);
        },
      });
  }

  onIframeLoad(): void {
    const frame = this.previewFrame()?.nativeElement;
    const body = frame?.contentDocument?.body;
    if (!frame || !body) return;

    this.previewResizeObserver?.disconnect();
    this.previewResizeObserver = null;
    if (this.previewLayoutFlushTimer != null) {
      clearTimeout(this.previewLayoutFlushTimer);
      this.previewLayoutFlushTimer = null;
    }

    const flushPreviewLayout = () => {
      const ro = this.previewResizeObserver;
      if (ro == null || !frame.isConnected) return;
      ro.disconnect();
      try {
        const h = Math.max(body.scrollHeight, 1);
        if (this.overlayHeightPx() !== h) {
          this.overlayHeightPx.set(h);
        }
        frame.style.height = `${Math.max(h, 200)}px`;
      } catch {
        /* cross-origin or torn document */
      } finally {
        try {
          ro?.observe(body);
        } catch {
          /* body detached */
        }
      }
    };

    const scheduleLayout = () => {
      if (this.previewLayoutFlushTimer != null) {
        clearTimeout(this.previewLayoutFlushTimer);
      }
      this.previewLayoutFlushTimer = setTimeout(() => {
        this.previewLayoutFlushTimer = null;
        flushPreviewLayout();
      }, 0);
    };

    scheduleLayout();
    try {
      this.previewResizeObserver = new ResizeObserver(() => scheduleLayout());
      this.previewResizeObserver.observe(body);
    } catch {
      /* ResizeObserver unsupported */
    }
  }

  private scheduleRefresh(ms = 320): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.runRefresh(), ms);
  }

  private runRefresh(): void {
    this.isLoading.set(true);
    this.store
      .renderPreviewHtml(this.tpl, this.store.snapshot)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (html) => {
          this.applyHtmlBlob(html);
          this.isLoading.set(false);
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.isLoading.set(false);
          if (err?.status === 403) {
            this.openUpgrade(err.error?.message);
          } else {
            this.toast.show('error', 'Preview', 'Could not load HTML preview.', 6000);
          }
        },
      });
  }

  private applyHtmlBlob(html: string): void {
    this.revokeBlobs();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const raw = URL.createObjectURL(blob);
    this.blobUrls.push(raw);
    this.iframeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(raw));
  }

  private revokeBlobs(): void {
    for (const u of this.blobUrls) {
      try {
        URL.revokeObjectURL(u);
      } catch {
        /* ignore */
      }
    }
    this.blobUrls = [];
  }

  private openUpgrade(message?: string): void {
    const ref = this.dialog.open(QuotaExhaustedModal, {
      panelClass: 'responsive-dialog-wrapper',
      maxWidth: '100vw',
      width: '100%',
      height: '100%',
      disableClose: true,
      data: {
        message:
          message ||
          'PDF export is not available on your current plan. Upgrade to export your resume.',
      },
    });
    ref.afterClosed().subscribe((r) => {
      if (r === 'upgrade') {
        this.dialog.open(UpgradePro, {
          panelClass: 'responsive-dialog-wrapper',
          maxWidth: '100vw',
          width: '100%',
          height: '100%',
          disableClose: true,
        });
      }
    });
  }
}
