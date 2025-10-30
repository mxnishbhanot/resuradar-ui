import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../core/services/payment';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-upgrade-pro',
  imports: [
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    CommonModule
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
  ) { }

  ngOnInit() {
    this.userName = this.data?.userName || 'User';
    this.userEmail = this.data?.userEmail || '';
  }

  startCheckout() {
    const orderId = `ORDER_${Date.now()}`;  // Generate unique ID; store in localStorage/session if needed
    const amount = 1000;  // Example: ₹10 in paise

    if (!(window as any).PhonePeCheckout) {
      this.toast.warning('Payment system not loaded. Please refresh and try again');
      return;
    }
    this.paymentService.initiatePayment({ orderId, amount }).subscribe({
      next: (res) => {
        this.close();
        const callback = (response: string) => {
          if (response === 'USER_CANCEL') {
            this.toast.info('Payment cancelled by user');
          } else if (response === 'CONCLUDED') {
            // Verify on backend
            this.paymentService.verifyPayment(orderId).subscribe({
              next: (verifyRes: any) => {
                if (verifyRes.success && verifyRes.data.status === 'COMPLETED') {

                  this.toast.success(`Payment successful! Transaction ID: ${verifyRes.data.transactionId}`);
                  this.userService.fetchCurrentUser().subscribe();
                  this.router.navigate(['/home/upload', { txId: verifyRes.data.transactionId }]);
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
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
