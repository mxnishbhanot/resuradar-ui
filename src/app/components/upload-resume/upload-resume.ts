import { Component, EventEmitter, Output } from '@angular/core';
import { ResumeService } from '../../core/services/resume';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-upload-resume',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule
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
    private snackBar: MatSnackBar
  ) {}

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
        this.showError('Please upload a PDF file');
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  private processFile(file: File) {
    if (!this.isValidFileType(file)) {
      this.showError('Please upload a PDF file (max 5MB)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showError('File size must be less than 5MB');
      return;
    }

    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.loading = true;

    this.resumeService.uploadResume(file).subscribe({
      next: (res) => {
        this.loading = false;
        this.showSuccess('Resume analyzed successfully!');
        this.resumeAnalyzed.emit(res.data);
      },
      error: (err) => {
        this.loading = false;
        console.error('Upload failed:', err);
        this.showError('Analysis failed. Please try again.');
        this.resetFile();
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

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  resetFile() {
    this.fileName = '';
    this.fileSize = '';
  }

  getFileIcon(): string {
    return this.loading ? 'hourglass_empty' : 'description';
  }
}
