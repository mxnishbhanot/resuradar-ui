// src/app/features/start-resume/start-resume.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'rr-start-resume',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './start-resume.html',
  styleUrls: ['./start-resume.scss']
})
export class StartResumeComponent {
  isUploading = false;
  selectedFileName = '';
  isDragOver = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private store: ResumeBuilderService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  startFromScratch(): void {
    this.store.clearLocal();
    this.router.navigate(['/build']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const file = event.dataTransfer?.files?.[0];
    this.processFile(file);
  }

  private processFile(file: File | undefined): void {
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.snackBar.open('Please upload a PDF or DOCX file.', 'Close', { duration: 3000 });
      return;
    }

    this.selectedFileName = file.name;
    this.uploadResume(file);
  }

  private uploadResume(file: File): void {
    this.isUploading = true;

    const formData = new FormData();
    formData.append('resume', file);

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    this.http.post(`${environment.apiUrl}/custom-resume/upload`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          if (response?.resume) {
            this.store.replace(response.resume);
            this.router.navigate(['/build']);
          } else {
            throw new Error('Invalid resume data');
          }
        },
        error: () => {
          this.snackBar.open('Failed to parse resume. Please try again or start from scratch.', 'Close', { duration: 4000 });
          this.resetUpload();
        },
        complete: () => {
          this.isUploading = false;
        }
      });
  }

  resetUpload(): void {
    this.isUploading = false;
    this.selectedFileName = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
