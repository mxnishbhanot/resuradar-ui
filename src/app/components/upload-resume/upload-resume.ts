// upload-resume.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { ResumeService } from '../../core/services/resume';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { GoogleAuthService } from '../../core/services/google-auth';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-upload-resume',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './upload-resume.html',
  styleUrls: ['./upload-resume.scss']
})
export class UploadResume {
  loading = false;
  fileName: string = '';
  fileSize: string = '';
  isDragOver = false;
  @Output() resumeAnalyzed = new EventEmitter<any>();

  constructor(
    private resumeService: ResumeService,
    private router: Router,
    private toast: ToastService,
    public googleAuth: GoogleAuthService,
    private dialog: MatDialog
  ) { }

  get isLoggedIn(): boolean {
    return this.googleAuth.isLoggedIn;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.processFile(file);
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidFileType(file)) {
        this.processFile(file);
      } else {
        this.toast.warning('Please upload a PDF file');
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.isLoggedIn) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processFile(file: File) {
    if (!this.isLoggedIn) return;

    if (!this.isValidFileType(file)) {
      this.toast.warning('Please upload a PDF file (max 5MB)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('File size must be less than 5MB');
      return;
    }

    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.loading = true;

    this.resumeService.uploadResume(file).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Resume analyzed successfully.');
        this.resumeService.setLatestAnalysis(res.data);
        this.router.navigate(['/analysis']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          const message = err.error?.message || 'You’ve used all your free analyses.';
          const modalRef = this.dialog.open(QuotaExhaustedModal, {
            data: { message },
            width: '100%',
            maxWidth: '520px',
            panelClass: 'quota-modal-dialog'
          });

          modalRef.afterClosed().subscribe((result: any) => {
            if (result === 'upgrade') {
              // Open your existing upgrade popup
              this.dialog.open(UpgradePro, {
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                panelClass: 'upgrade-pro-dialog',
                hasBackdrop: true,
                disableClose: false,
              });
            }
          });
          this.resetFile();
        } else {
          console.error('Upload failed:', err);
          this.toast.error('Analysis failed. Please try again.');
          this.resetFile();
        }
      }
    });
  }

  private isValidFileType(file: File): boolean {
    return file.type === 'application/pdf';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  resetFile() {
    this.fileName = '';
    this.fileSize = '';
  }

  openLogin(event?: Event) {
    if (event) event.stopPropagation();
    this.googleAuth.signIn();
  }
}
