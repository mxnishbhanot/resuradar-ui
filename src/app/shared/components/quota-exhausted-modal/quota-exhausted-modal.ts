import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-quota-exhausted-modal',
  template: `
    <div class="quota-modal">
      <div class="modal-icon">
        <mat-icon>workspace_premium</mat-icon>
      </div>
      <h2 class="modal-title">Upload Limit Reached</h2>
      <p class="modal-message">{{ data.message || 'You’ve used all your free analyses.' }}</p>
      <div class="modal-actions">
        <button mat-raised-button class="upgrade-btn" (click)="upgrade()">
          <mat-icon>rocket_launch</mat-icon>
          Upgrade to Pro
        </button>
        <button mat-stroked-button class="cancel-btn" (click)="close()">
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .quota-modal {
      padding: 32px;
      text-align: center;
      max-width: 480px;
      font-family: 'Inter', 'Roboto', sans-serif;
    }
    .modal-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .modal-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }
    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1f36;
      margin: 0 0 12px;
    }
    .modal-message {
      color: #5d6b82;
      font-size: 1.125rem;
      line-height: 1.6;
      margin: 0 0 28px;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .upgrade-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      padding: 0 24px;
      height: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }
    .cancel-btn {
      color: #667eea;
      border-color: #667eea;
      font-weight: 600;
      padding: 0 24px;
      height: 48px;
      border-radius: 12px;
    }
    @media (max-width: 600px) {
      .quota-modal { padding: 24px 16px; }
      .modal-actions { flex-direction: column; }
      .upgrade-btn, .cancel-btn {
        width: 100%;
        max-width: 300px;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class QuotaExhaustedModal {
  constructor(
    public dialogRef: MatDialogRef<QuotaExhaustedModal>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  upgrade() {
    this.dialogRef.close('upgrade');
  }

  close() {
    this.dialogRef.close();
  }
}
