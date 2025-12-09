import { Component, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { ToastService } from '../../core/services/toast';
import { GoogleAuthService } from '../../core/services/google-auth';
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

  private router = inject(Router);
  private store = inject(ResumeBuilderService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private googleAuth = inject(GoogleAuthService);

  // Signals instead of normal properties
  isUploading = signal(false);
  selectedFileName = signal<string>('');
  isDragOver = signal(false);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isLoggedIn = computed(() => this.googleAuth.isLoggedIn);

  openLogin(): void {
    this.googleAuth.signIn();
  }

  startFromScratch(): void {
    this.store.startNewResume();
    this.router.navigate(['/build']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    this.processFile(file);
  }

  private processFile(file?: File): void {
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.toast.show(
        'warning',
        'Upload Warning',
        'Please upload a PDF or DOCX file.',
        5000
      );
      return;
    }

    this.selectedFileName.set(file.name);
    this.uploadResume(file);
  }

  private uploadResume(file: File): void {
    this.isUploading.set(true);

    const formData = new FormData();
    formData.append('resume', file);

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      ...(token && { Authorization: `Bearer ${token}` })
    });

    this.http.post(`${environment.apiUrl}/custom-resume/upload`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          const resume = response?.resume;
          if (!resume) {
            throw new Error('Invalid resume data');
          }

          this.store.replace(resume);
          this.router.navigate(['/build']);
        },
        error: () => {
          this.toast.show(
            'error',
            'Parsing Failed',
            'Failed to parse resume. Please try again or start from scratch.',
            5000
          );
          this.resetUpload();
        },
        complete: () => {
          this.isUploading.set(false);
        }
      });
  }

  resetUpload(): void {
    this.isUploading.set(false);
    this.selectedFileName.set('');
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
