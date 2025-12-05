import { Component, OnInit, Inject } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PdfViewerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {

  currentTemplate = 'modern';
  pdfUrl: any = null;
  isLoading = true;
  zoom = 1.0;
  showEmptyState = false;

  constructor(
    private store: ResumeBuilderService,
    public dialogRef: MatDialogRef<PreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.loadPdfPreview();
  }

  loadPdfPreview() {
    this.isLoading = true;
    this.zoom = 1.0;
    this.showEmptyState = false;

    this.store.exportPdf(this.currentTemplate, this.data?.resumeId)
      .subscribe({
        next: (blob: Blob) => {
          // Check if the blob size is zero, indicating no content was generated
          if (blob.size === 0) {
             this.showEmptyState = true;
          } else {
            this.pdfUrl = URL.createObjectURL(blob);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('PDF preview failed:', err);
          this.isLoading = false;
          this.showEmptyState = true;
          // Optionally, you could also set showEmptyState here if the error indicates no data
          // For now, we'll just hide the loader and let the user retry.
        }
      });
  }

  onPDFLoaded() {
    setTimeout(() => {
      this.isLoading = false;
    }, 300); // smooth fade-in
  }

  changeTemplate() {
    this.loadPdfPreview();
  }

  zoomIn() {
    if (this.zoom < 2.0) { // Cap zoom at 200%
      this.zoom += 0.1;
    }
  }

  zoomOut() {
    if (this.zoom > 0.2) {
      this.zoom -= 0.1;
    }
  }

  resetZoom() {
    this.zoom = 1.0;
  }

  downloadPDF() {
    this.store.exportPdf(this.currentTemplate, this.data?.resumeId)
      .subscribe((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  close() {
    this.dialogRef.close();
  }
}
