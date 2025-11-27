import { Component, OnInit, Inject } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ResumeBuilderService } from '../../core/services/resume-builder.service';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'rr-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PdfViewerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {

  currentTemplate = 'modern';
  pdfUrl: any = null;
  isLoading = true;
  zoom = 1.0;

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

    this.store.exportPdf(this.currentTemplate, this.data?.resumeId)
      .subscribe({
        next: (blob: Blob) => {
          this.pdfUrl = URL.createObjectURL(blob);

          if (blob.size > 0) {
            this.isLoading = false;
          } else {
            this.isLoading = true;
          }
        },
        error: (err) => {
          console.error('PDF preview failed:', err);
          this.isLoading = false;
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
