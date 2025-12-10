import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { signal, computed, Signal } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ResumeService } from '../../core/services/resume';
import { GoogleAuthService } from '../../core/services/google-auth';
import { ToastService } from '../../core/services/toast';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';

@Component({
  selector: 'app-upload-resume',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
],
  templateUrl: './upload-resume.html',
  styleUrls: ['./upload-resume.scss']
})
export class UploadResume implements OnInit, OnDestroy {
  @Output() resumeAnalyzed = new EventEmitter<any>();

  // Signals for UI state
  loading = signal<boolean>(false);
  fileName = signal<string>('');
  fileSize = signal<string>('');
  isDragOver = signal<boolean>(false);

  // Derived signal for user state (initialized in constructor)
  isLoggedIn!: Signal<boolean>;

  // Track subscriptions for cleanup
  private subs: Subscription[] = [];

  constructor(
    private resumeService: ResumeService,
    private router: Router,
    private toast: ToastService,
    public googleAuth: GoogleAuthService,
    private dialog: MatDialog
  ) {
    // computed for login state so template reacts automatically
    this.isLoggedIn = computed(() => {
      // Support both boolean flag or presence of user object in service
      // (adapt if your service exposes a different API)
      const valAny: any = (this.googleAuth as any).isLoggedIn ?? (this.googleAuth as any).user;
      // if isLoggedIn boolean exists use it, else check user presence
      if (typeof (this.googleAuth as any).isLoggedIn === 'boolean') {
        return !!(this.googleAuth as any).isLoggedIn;
      }
      // fallback: check user object truthiness
      return !!(this.googleAuth as any).user;
    });
  }

  ngOnInit(): void {
    // no-op; kept for future extension
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => {
      try { s.unsubscribe(); } catch { /* noop */ }
    });
  }

  // --- Template event handlers ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files.item(0) : null;
    if (!file) return;
    this.processFile(file);
    // reset input value to allow reselecting the same file later
    input.value = '';
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidFileType(file)) {
        this.processFile(file);
      } else {
        this.toast.show('warning', 'Upload Warning', 'Please upload a PDF file');
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isLoggedIn()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  // --- Core logic ---
  private processFile(file: File): void {
    if (!this.isLoggedIn()) return;

    if (!this.isValidFileType(file) || file.size > 5 * 1024 * 1024) {
      this.toast.show('warning', 'Upload Warning', 'Please upload a PDF file (max 5MB)');
      return;
    }

    this.setFileMeta(file);
    this.loading.set(true);

    const sub = this.resumeService.uploadResume(file)
      .pipe(
        catchError(err => {
          // pass error downstream to subscriber, but also handle here if needed
          return of({ __uploadError: true, error: err });
        })
      )
      .subscribe((res: any) => {
        this.loading.set(false);

        if (res && res.__uploadError && res.error) {
          const err = res.error;
          if (err.status === 403) {
            this.handleQuotaExceeded(err);
          } else {
            console.error('Upload failed:', err);
            this.toast.show('error', 'Upload Failed', 'An error occurred while uploading your resume. Please try again.');
          }
          this.resetFile();
          return;
        }

        // success path
        this.toast.show('success', 'Success', 'Resume analyzed successfully.');
        if (res?.data) {
          this.resumeService.setLatestAnalysis(res.data);
          this.resumeAnalyzed.emit(res.data);
        }
        // navigate to analysis page
        this.router.navigate(['/analysis']);
      });

    this.subs.push(sub);
  }

  private setFileMeta(file: File): void {
    this.fileName.set(file.name);
    this.fileSize.set(this.formatFileSize(file.size));
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

  private handleQuotaExceeded(err: any): void {
    const message = err.error?.message || 'You’ve used all your free analyses.';
    const modalRef = this.dialog.open(
      QuotaExhaustedModal,
      this.getFullScreenDialogConfig({ message })
    );

    const sub = modalRef.afterClosed().subscribe((result) => {
      if (result === 'upgrade') {
        this.dialog.open(UpgradePro, this.getFullScreenDialogConfig());
      }
    });

    this.subs.push(sub);
  }

  private isValidFileType(file: File): boolean {
    return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  resetFile(): void {
    this.fileName.set('');
    this.fileSize.set('');
  }

  openLogin(event?: Event): void {
    if (event) event.stopPropagation();
    this.googleAuth.signIn();
  }
}
