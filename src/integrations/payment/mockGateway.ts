// Mock Payment Gateway - Simulates payment processing for PoC

import type {
  PaymentRequest,
  PaymentResponse,
  PaymentRecord,
  PaymentGatewayInterface,
  TransactionStatus,
} from './types';

// In-memory payment store for the mock gateway
const paymentStore = new Map<string, PaymentRecord>();

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a receipt number
 */
function generateReceiptNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCP-${dateStr}-${seq}`;
}

/**
 * Simulate payment success rate (90% success for demo)
 */
function simulatePaymentOutcome(): { success: boolean; status: TransactionStatus } {
  const random = Math.random();
  if (random < 0.9) {
    return { success: true, status: 'success' };
  }
  return { success: false, status: 'failed' };
}

/**
 * Mock Payment Gateway implementation
 */
export const mockPaymentGateway: PaymentGatewayInterface = {
  /**
   * Process a payment request
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();
    const timestamp = new Date().toISOString();
    const { success, status } = simulatePaymentOutcome();

    const response: PaymentResponse = {
      success,
      transactionId,
      taxpayerId: request.taxpayerId,
      amount: request.amount,
      method: request.method,
      status,
      timestamp,
      receiptNumber,
      error: success ? undefined : 'Payment declined by bank',
    };

    // Store successful payments
    if (success) {
      const record: PaymentRecord = {
        transactionId,
        taxpayerId: request.taxpayerId,
        amount: request.amount,
        method: request.method,
        status,
        timestamp,
        receiptNumber,
        reference: request.reference,
      };
      paymentStore.set(transactionId, record);
    }

    console.log(`[MOCK PAYMENT] ${success ? 'Success' : 'Failed'}: ${transactionId} - ₹${request.amount} for ${request.taxpayerId}`);

    return response;
  },

  /**
   * Get payment status by transaction ID
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentRecord | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return paymentStore.get(transactionId) || null;
  },

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string): Promise<PaymentResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const original = paymentStore.get(transactionId);
    
    if (!original) {
      return {
        success: false,
        transactionId,
        taxpayerId: '',
        amount: 0,
        method: 'cash',
        status: 'failed',
        timestamp: new Date().toISOString(),
        receiptNumber: '',
        error: 'Original transaction not found',
      };
    }

    // Update original record status
    original.status = 'refunded';
    paymentStore.set(transactionId, original);

    const refundTransactionId = generateTransactionId();
    
    return {
      success: true,
      transactionId: refundTransactionId,
      taxpayerId: original.taxpayerId,
      amount: original.amount,
      method: original.method,
      status: 'refunded',
      timestamp: new Date().toISOString(),
      receiptNumber: generateReceiptNumber(),
    };
  },
};

/**
 * Get all payment records (for debugging/admin)
 */
export function getAllPayments(): PaymentRecord[] {
  return Array.from(paymentStore.values());
}

/**
 * Get payments for a specific taxpayer
 */
export function getTaxpayerPayments(taxpayerId: string): PaymentRecord[] {
  return Array.from(paymentStore.values()).filter(p => p.taxpayerId === taxpayerId);
}

/**
 * Clear all payments (for testing)
 */
export function clearPaymentStore(): void {
  paymentStore.clear();
}

/**
 * Calculate total collected for a taxpayer
 */
export function getTaxpayerTotalPaid(taxpayerId: string): number {
  return getTaxpayerPayments(taxpayerId)
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);
}
