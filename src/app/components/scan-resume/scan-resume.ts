// scan-resume.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoogleAuthService } from '../../core/services/google-auth';
import { ResumeService } from '../../core/services/resume';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { MatDialog } from '@angular/material/dialog';
import { QuotaExhaustedModal } from '../../shared/components/quota-exhausted-modal/quota-exhausted-modal';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';

@Component({
  selector: 'app-scan-resume',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './scan-resume.html',
  styleUrls: ['./scan-resume.scss']
})
export class ScanResume {
  loading = false;
  fileName = '';
  fileSize = '';
  file: any = null;
  jobDescription = '';
  jdError = false;
  isDragOver = false;

  constructor(
    public googleAuth: GoogleAuthService,
    private resumeService: ResumeService,
    private router: Router,
    private toast: ToastService,
    private dialog: MatDialog
  ) { }

  get isLoggedIn(): boolean {
    return this.googleAuth.isLoggedIn;
  }

  get hasFile(): boolean {
    return !!this.fileName;
  }

  get wordCount(): number {
    return this.jobDescription.trim() ? this.jobDescription.trim().split(/\s+/).length : 0;
  }

  get canAnalyze(): boolean {
    return this.hasFile && this.wordCount > 0 && this.wordCount <= 500 && !this.loading;
  }

  onFileSelected(event: any) {
    if (!this.isLoggedIn) return;
    const file = event.target.files[0];
    if (file) this.processFile(file);
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (!this.isLoggedIn) return;

    const files = event.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.processFile(file);
      } else {
        this.toast.warning('Please upload a PDF file');
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.isLoggedIn) this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('File must be under 5MB');
      return;
    }
    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.file = file;
  }

  analyzeMatch() {
    if (this.wordCount === 0 || this.wordCount > 500) {
      this.jdError = true;
      this.toast.warning('Job description must be 1–500 words');
      return;
    }
    this.jdError = false;
    this.loading = true;

    const formData = new FormData();
    const input = document.querySelector('#fileInput') as HTMLInputElement;

    if (this.file) {
      formData.append('resume', this.file);
    }
    formData.append('jobDescription', this.jobDescription);

    this.resumeService.matchResume(formData).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Match analysis complete!');
        // Store result (adjust based on your service)
        console.log(res.data);

        this.resumeService.setLatestMatchAnalysis(res.data);
        this.router.navigate(['/match-results']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          const message = err.error?.message || 'JD matching is a Pro feature.';
          const modalRef = this.dialog.open(QuotaExhaustedModal, {
            data: { message },
            width: '100%',
            maxWidth: '520px',
            panelClass: 'quota-modal-dialog'
          });
          modalRef.afterClosed().subscribe(result => {
            if (result === 'upgrade') {
              this.dialog.open(UpgradePro, {
                width: '100%',
                maxWidth: '520px',
                panelClass: 'upgrade-pro-dialog'
              });
            }
          });
        } else {
          this.toast.error('Analysis failed. Please try again.');
        }
        this.resetFile();
      }
    });
  }

  resetFile() {
    this.fileName = '';
    this.fileSize = '';
    this.file = null;
    const input = document.querySelector('#fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  openLogin(event?: Event) {
    if (event) event.stopPropagation();
    this.googleAuth.signIn();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
