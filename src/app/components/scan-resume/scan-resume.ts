import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { TextFieldModule } from '@angular/cdk/text-field';

import { signal, computed, Signal } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { GoogleAuthService } from '../../core/services/google-auth';
import { ResumeService } from '../../core/services/resume';
import { ToastService } from '../../core/services/toast';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';

@Component({
  selector: 'app-scan-resume',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    TextFieldModule
],
  templateUrl: './scan-resume.html',
  styleUrls: ['./scan-resume.scss'],
})
export class ScanResume implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // UI state as signals
  loading = signal<boolean>(false);
  fileName = signal<string>('');
  fileSize = signal<string>('');
  file = signal<File | null>(null);
  jobDescription = signal<string>('');
  jdError = signal<boolean>(false);
  isDragOver = signal<boolean>(false);

  // Derived signals
  isLoggedIn!: Signal<boolean>;
  hasFile!: Signal<boolean>;
  wordCount!: Signal<number>;
  canAnalyze!: Signal<boolean>;

  private subs: Subscription[] = [];

  constructor(
    public googleAuth: GoogleAuthService,
    private resumeService: ResumeService,
    private router: Router,
    private toast: ToastService,
    private dialog: MatDialog
  ) {
    // derived signals
    this.isLoggedIn = computed(() => {
      // support both boolean flag or user object on service
      const maybeBool = (this.googleAuth as any).isLoggedIn;
      if (typeof maybeBool === 'boolean') return !!maybeBool;
      const maybeUser = (this.googleAuth as any).user;
      return !!maybeUser;
    });

    this.hasFile = computed(() => !!this.fileName());
    this.wordCount = computed(() => {
      const txt = this.jobDescription().trim();
      return txt ? txt.split(/\s+/).length : 0;
    });

    this.canAnalyze = computed(() =>
      this.hasFile() && this.wordCount() > 0 && this.wordCount() <= 500 && !this.loading()
    );
  }

  ngOnInit(): void {
    // nothing extra to init
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => {
      try { s.unsubscribe(); } catch { /* noop */ }
    });
  }

  // --- File handlers ---
  onFileSelected(event: Event): void {
    if (!this.isLoggedIn()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files.item(0) : null;
    if (file) this.processFile(file);
    // allow reselecting same file later
    if (input) input.value = '';
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (!this.isLoggedIn()) return;

    const files = event.dataTransfer?.files;
    if (files && files.length) {
      const file = files[0];
      if (this.isValidFileType(file)) {
        this.processFile(file);
      } else {
        this.toast.show('warning', 'Upload Warning', 'Please upload a PDF file', 5000);
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isLoggedIn()) this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  // --- Core ---
  private processFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.toast.show('warning', 'Upload Warning', 'File must be under 5MB', 5000);
      return;
    }

    this.fileName.set(file.name);
    this.fileSize.set(this.formatFileSize(file.size));
    this.file.set(file);
  }

  analyzeMatch(): void {
    if (this.wordCount() < 1 || this.wordCount() > 500) {
      this.jdError.set(true);
      this.toast.show('warning', 'Input Warning', 'Job description must be 1–500 words');
      return;
    }

    this.jdError.set(false);
    this.loading.set(true);

    const formData = new FormData();
    const f = this.file();
    if (f) formData.append('resume', f);
    formData.append('jobDescription', this.jobDescription());

    const sub = this.resumeService.matchResume(formData)
      .pipe(
        catchError(err => of({ __matchError: true, error: err }))
      )
      .subscribe((res: any) => {
        this.loading.set(false);

        if (res && res.__matchError && res.error) {
          const err = res.error;
          if (err.status === 403) {
            this.handleQuotaExceeded(err, 'JD matching is a Pro feature.');
          } else {
            this.toast.show('error', 'Analysis Failed', 'Analysis failed. Please try again.');
          }
          this.resetFile();
          return;
        }

        this.toast.show('success', 'Analysis Complete', 'Match analysis complete!');
        if (res?.data) {
          this.resumeService.setLatestMatchAnalysis(res.data);
        }
        this.router.navigate(['/match-results']);
      });

    this.subs.push(sub);
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

  private handleQuotaExceeded(err: any, fallbackMsg: string): void {
    const message = err.error?.message || fallbackMsg;
    const modalRef = this.dialog.open(
      QuotaExhaustedModal,
      this.getFullScreenDialogConfig({ message })
    );

    const sub = modalRef.afterClosed().subscribe(result => {
      if (result === 'upgrade') {
        this.dialog.open(UpgradePro, this.getFullScreenDialogConfig());
      }
    });

    this.subs.push(sub);
  }

  resetFile(): void {
    this.fileName.set('');
    this.fileSize.set('');
    this.file.set(null);
    this.jobDescription.set('');
    this.jdError.set(false);

    // reset native file input if present
    try {
      const el = this.fileInputRef?.nativeElement;
      if (el) el.value = '';
    } catch { /* noop */ }
  }

  openLogin(event?: Event): void {
    if (event) event.stopPropagation();
    this.googleAuth.signIn();
  }

  private isValidFileType(file: File): boolean {
    return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
