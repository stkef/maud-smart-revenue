// Types for the payment system

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'netbanking' | 'cheque';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface PaymentRequest {
  taxpayerId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  taxpayerId: string;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  timestamp: string;
  receiptNumber: string;
  error?: string;
}

export interface PaymentRecord {
  transactionId: string;
  taxpayerId: string;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  timestamp: string;
  receiptNumber: string;
  reference?: string;
}

export interface PaymentGatewayInterface {
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPaymentStatus(transactionId: string): Promise<PaymentRecord | null>;
  refundPayment(transactionId: string): Promise<PaymentResponse>;
}

export interface PaymentCallbacks {
  onSuccess?: (response: PaymentResponse) => void;
  onFailure?: (response: PaymentResponse) => void;
  onArrearsReduced?: (taxpayerId: string, newArrears: number) => void;
  onRiskRecalculation?: (taxpayerId: string) => void;
  onStopNudges?: (taxpayerId: string) => void;
}
