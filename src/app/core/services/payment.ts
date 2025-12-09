import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
}

export interface InitiatePaymentResponse {
  tokenUrl: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    status: string;  // 'COMPLETED' | 'PENDING' | 'FAILED'
    transactionId?: string;
    amount: number;
    errorCode?: string;
    expireAt?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private http = inject(HttpClient);

  /** 🔐 Build Authorization header */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  /** 💳 Initiate payment session */
  initiatePayment(
    request: InitiatePaymentRequest
  ): Observable<InitiatePaymentResponse> {
    return this.http.post<InitiatePaymentResponse>(
      `${environment.apiUrl}/initiate-payment`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  /** 🧾 Verify payment status */
  verifyPayment(orderId: string): Observable<VerifyPaymentResponse> {
    return this.http.get<VerifyPaymentResponse>(
      `${environment.apiUrl}/verify-payment/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
