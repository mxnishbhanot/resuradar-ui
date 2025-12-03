// upload-resume.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { ResumeService } from '../../core/services/resume';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { GoogleAuthService } from '../../core/services/google-auth';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ToastService } from '../../core/services/toast';

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
        this.toast.show('warning', 'Upload Warning', 'Please upload a PDF file');
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

    // Validate file
    if (!this.isValidFileType(file) || file.size > 5 * 1024 * 1024) {
      this.toast.show(
        'warning',
        'Upload Warning',
        'Please upload a PDF file (max 5MB)'
      );
      return;
    }

    this.setFileMeta(file);
    this.loading = true;

    this.resumeService.uploadResume(file).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.show('success', 'Success', 'Resume analyzed successfully.');
        this.resumeService.setLatestAnalysis(res.data);
        this.router.navigate(['/analysis']);
      },

      error: (err) => {
        this.loading = false;

        if (err.status === 403) {
          this.handleQuotaExceeded(err);
        } else {
          console.error('Upload failed:', err);
          this.toast.show(
            'error',
            'Upload Failed',
            'An error occurred while uploading your resume. Please try again.'
          );
        }

        this.resetFile();
      }
    });
  }

  private setFileMeta(file: File) {
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
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

  private handleQuotaExceeded(err: any) {
    const message = err.error?.message || 'You’ve used all your free analyses.';
    const modalRef = this.dialog.open(
      QuotaExhaustedModal,
      this.getFullScreenDialogConfig({ message })
    );

    modalRef.afterClosed().subscribe((result) => {
      if (result === 'upgrade') {
        this.dialog.open(UpgradePro, this.getFullScreenDialogConfig());
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
