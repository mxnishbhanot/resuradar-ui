import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ResumeService } from '../../core/services/resume';
import { UserService } from '../../core/services/user';
import { UpgradePro } from '../upgrade-pro/upgrade-pro';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-create-resume',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './create-resume.html',
  styleUrls: ['./create-resume.scss']
})
export class CreateResume {
  @ViewChild('fileInput') fileInput!: ElementRef;
  private userService = inject(UserService);
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  user: any = null;
  isPro = true;
  mode: 'upload' | 'scratch' | null = null;
  resumeData: any = null;
  isLoading = false;

  constructor() {
    this.userService.user$.subscribe(user => {
      this.user = user;
      // this.isPro = user?.isPremium;
    });
  }

  selectMode(mode: 'upload' | 'scratch') {
    if (!this.isPro) {
      this.openUpgrade();
      return;
    }
    this.mode = mode;
    if (mode === 'upload') {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      this.toast.warning('Please upload a PDF file');
      return;
    }
    this.isLoading = true;
    // this.resumeService.parseResume(file).subscribe({
    //   next: (res: any) => {
    //     this.resumeData = res.data;
    //     this.isLoading = false;
    //   },
    //   error: (err: any) => {
    //     this.toast.error('Failed to parse resume. Try again.');
    //     this.isLoading = false;
    //   }
    // });
  }

  openUpgrade() {
    this.dialog.open(UpgradePro, {
      width: '100%',
      maxWidth: '520px',
      maxHeight: '90vh',
      panelClass: 'upgrade-pro-dialog'
    });
  }

  onSave(data: any) {
    // Save to backend
    // this.resumeService.saveResumeDraft(data).subscribe({
    //   next: () => this.toast.success('Resume saved!'),
    //   error: () => this.toast.error('Failed to save.')
    // });
  }

  onExportPdf() {
    // Trigger PDF export (you can open a new tab or download)
    this.toast.info('Exporting PDF...');
    // TODO: call /api/resume/export with resume data
  }

  onCancel() {
    this.mode = null;
    this.resumeData = null;
  }
}
