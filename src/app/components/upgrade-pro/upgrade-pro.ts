import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../core/services/payment';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user';
import { ToastService } from '../../core/services/toast';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-upgrade-pro',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './upgrade-pro.html',
  styleUrls: ['./upgrade-pro.scss'],
})
export class UpgradePro implements OnInit {
  isLoading = false;
  userName = '';
  userEmail = '';

  constructor(
    private userService: UserService,
    private toast: ToastService,
    private paymentService: PaymentService,
    private router: Router,
    public dialogRef: MatDialogRef<UpgradePro>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.userName = this.data?.userName || 'User';
    this.userEmail = this.data?.userEmail || '';
  }

  startCheckout(): void {
    this.isLoading = true;
    const orderId = `ORDER_${Date.now()}`;
    const amount = 1000; // ₹10 in paise

    if (!(window as any).PhonePeCheckout) {
      this.toast.warning('Payment system not loaded. Please refresh and try again');
      this.isLoading = false;
      return;
    }

    this.paymentService.initiatePayment({ orderId, amount }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.close();

        const callback = (response: string) => {
          if (response === 'USER_CANCEL') {
            this.toast.info('Payment cancelled by user');
          } else if (response === 'CONCLUDED') {
            this.verifyPayment(orderId);
          } else {
            console.error('Payment error:', response);
            this.toast.error('Payment failed. Please try again.');
          }
        };

        (window as any).PhonePeCheckout.transact({
          tokenUrl: res.tokenUrl,
          callback,
          type: 'IFRAME'
        });
      },
      error: (err) => {
        console.error('Failed to initiate payment:', err);
        this.toast.error('Failed to start payment. Please try again.');
        this.isLoading = false;
      }
    });
  }

  private verifyPayment(orderId: string): void {
    this.paymentService.verifyPayment(orderId).subscribe({
      next: (verifyRes: any) => {
        if (verifyRes.success && verifyRes.data.status === 'COMPLETED') {
          this.toast.success(`Payment successful! Transaction ID: ${verifyRes.data.transactionId}`);
          this.userService.fetchCurrentUser().subscribe();
          this.router.navigate(['/upload', { txId: verifyRes.data.transactionId }]);
        } else if (verifyRes.data.status === 'PENDING') {
          this.toast.warning('Payment is processing. Please wait...');
        } else {
          this.toast.error(`Payment failed: ${verifyRes.data.errorCode || 'Unknown error'}`);
        }
      },
      error: (err) => {
        console.error('Verification failed:', err);
        this.toast.error('Verification failed. Please contact support.');
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
