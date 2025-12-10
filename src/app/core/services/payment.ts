import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentRuntimeService } from './environment.service';

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
    status: string;
    transactionId?: string;
    amount: number;
    errorCode?: string;
    expireAt?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private runtimeEnv = inject(EnvironmentRuntimeService);

  /** SSR-safe browser check */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Safely read token only in browser */
  private getToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  /** Build authorization headers safely for SSR */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();

    return token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      : new HttpHeaders({
          'Content-Type': 'application/json'
        });
  }

  /** 💳 Initiate payment session */
  initiatePayment(
    request: InitiatePaymentRequest
  ): Observable<InitiatePaymentResponse> {
    return this.http.post<InitiatePaymentResponse>(
      `${this.runtimeEnv.getApiUrl()}/initiate-payment`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  /** 🧾 Verify payment status */
  verifyPayment(orderId: string): Observable<VerifyPaymentResponse> {
    return this.http.get<VerifyPaymentResponse>(
      `${this.runtimeEnv.getApiUrl()}/verify-payment/${orderId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
