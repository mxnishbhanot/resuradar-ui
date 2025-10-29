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
      this.toast.show('⚠️ Payment system not loaded. Please refresh and try again', 'warning');
      return;
    }
    this.paymentService.initiatePayment({ orderId, amount }).subscribe({
      next: (res) => {
        this.close();
        const callback = (response: string) => {
          if (response === 'USER_CANCEL') {
            this.toast.show('⚠️ Payment cancelled by user', 'warning');

          } else if (response === 'CONCLUDED') {
            // Verify on backend
            this.paymentService.verifyPayment(orderId).subscribe({
              next: (verifyRes: any) => {
                if (verifyRes.success && verifyRes.data.status === 'COMPLETED') {

                  this.toast.show(`✅ Payment successful! Transaction ID: ${verifyRes.data.transactionId}`, 'success');
                  this.userService.fetchCurrentUser().subscribe();
                  this.router.navigate(['/home/upload', { txId: verifyRes.data.transactionId }]);
                } else if (verifyRes.data.status === 'PENDING') {
                  this.toast.show('⏳ Payment is processing. Please wait...', 'warning');
                } else {
                  this.toast.show(`❌ Payment failed: ${verifyRes.data.errorCode || 'Unknown error'}`, 'error');
                }
              },
              error: (err) => {
                console.error('Verification failed:', err);
                this.toast.show('❌ Verification failed. Please contact support.', 'error');
              }
            });
          } else {
            console.error('Payment error:', response);
            this.toast.show('❌ Payment failed. Please try again.', 'error');
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
        this.toast.show('❌ Failed to start payment. Please try again.', 'error');
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
