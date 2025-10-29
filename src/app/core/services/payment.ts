import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

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
    status: string;  // 'COMPLETED', 'PENDING', 'FAILED'
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

  constructor(private http: HttpClient) {}

  // Utility method to build headers with bearer token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token'); // <-- stored after login
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  initiatePayment(request: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<InitiatePaymentResponse>(
      `${environment.apiUrl}/initiate-payment`,
      request,
      { headers }
    );
  }

  verifyPayment(orderId: string): Observable<VerifyPaymentResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<VerifyPaymentResponse>(
      `${environment.apiUrl}/verify-payment/${orderId}`,
      { headers }
    );
  }
}
