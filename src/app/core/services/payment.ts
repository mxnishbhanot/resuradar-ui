import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentRuntimeService } from './environment.service';

export interface InitiatePaymentRequest {
  orderId: string;
  planId: string;
}

export interface InitiatePaymentResponse {
  tokenUrl: string;
  order: {
    orderId: string;
    planId: string;
    amount: number;
    currency: string;
  };
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
  private runtimeEnv = inject(EnvironmentRuntimeService);

  initiatePayment(request: InitiatePaymentRequest): Observable<InitiatePaymentResponse> {
    return this.http.post<InitiatePaymentResponse>(
      `${this.runtimeEnv.getApiUrl()}/initiate-payment`,
      request
    );
  }

  verifyPayment(orderId: string): Observable<VerifyPaymentResponse> {
    return this.http.get<VerifyPaymentResponse>(
      `${this.runtimeEnv.getApiUrl()}/verify-payment/${orderId}`
    );
  }
}
