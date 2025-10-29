import { Component, EventEmitter, Output } from '@angular/core';
import { ResumeService } from '../../core/services/resume';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast';

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
    private router: Router, private toast: ToastService
  ) { }

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
      this.toast.show('Please upload a PDF file)', 'warning');

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
      this.toast.show('Please upload a PDF file (max 5MB)', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.show('File size must be less than 5MB', 'warning');
      return;
    }

    this.fileName = file.name;
    this.fileSize = this.formatFileSize(file.size);
    this.loading = true;

    this.resumeService.uploadResume(file).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.show('Resume analyzed successfully.', 'success');
        this.resumeService.setLatestAnalysis(res.data);
        this.router.navigate(['/home/analysis']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Upload failed:', err);
        this.toast.show('Analysis failed. Please try again.', 'error');
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


  resetFile() {
    this.fileName = '';
    this.fileSize = '';
  }

  getFileIcon(): string {
    return this.loading ? 'hourglass_empty' : 'description';
  }
}
