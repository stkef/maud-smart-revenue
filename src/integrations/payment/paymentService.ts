// Payment Service - Orchestrates payment processing with callbacks

import type {
  PaymentRequest,
  PaymentResponse,
  PaymentGatewayInterface,
  PaymentCallbacks,
  PaymentRecord,
} from './types';
import { mockPaymentGateway, getTaxpayerTotalPaid, getTaxpayerPayments } from './mockGateway';

// Current gateway (can be swapped for real gateway later)
let currentGateway: PaymentGatewayInterface = mockPaymentGateway;

/**
 * Set the active payment gateway
 */
export function setPaymentGateway(gateway: PaymentGatewayInterface): void {
  currentGateway = gateway;
}

/**
 * Get current gateway info
 */
export function getGatewayInfo(): { name: string; type: 'mock' | 'live' } {
  return {
    name: currentGateway === mockPaymentGateway ? 'Mock Payment Gateway' : 'Live Gateway',
    type: currentGateway === mockPaymentGateway ? 'mock' : 'live',
  };
}

/**
 * Process a payment with optional callbacks
 */
export async function processPayment(
  request: PaymentRequest,
  callbacks?: PaymentCallbacks
): Promise<PaymentResponse> {
  console.log(`[PAYMENT SERVICE] Processing payment: ₹${request.amount} for ${request.taxpayerId}`);

  const response = await currentGateway.processPayment(request);

  if (response.success) {
    console.log(`[PAYMENT SERVICE] Payment successful: ${response.transactionId}`);
    
    // Trigger success callback
    callbacks?.onSuccess?.(response);
    
    // Trigger arrears reduction callback
    const totalPaid = getTaxpayerTotalPaid(request.taxpayerId);
    callbacks?.onArrearsReduced?.(request.taxpayerId, totalPaid);
    
    // Trigger risk recalculation
    callbacks?.onRiskRecalculation?.(request.taxpayerId);
    
    // Stop nudges for this taxpayer
    callbacks?.onStopNudges?.(request.taxpayerId);
  } else {
    console.log(`[PAYMENT SERVICE] Payment failed: ${response.error}`);
    callbacks?.onFailure?.(response);
  }

  return response;
}

/**
 * Get payment status
 */
export async function getPaymentStatus(transactionId: string): Promise<PaymentRecord | null> {
  return currentGateway.getPaymentStatus(transactionId);
}

/**
 * Process refund
 */
export async function processRefund(transactionId: string): Promise<PaymentResponse> {
  console.log(`[PAYMENT SERVICE] Processing refund for: ${transactionId}`);
  return currentGateway.refundPayment(transactionId);
}

/**
 * Get taxpayer payment history
 */
export function getPaymentHistory(taxpayerId: string): PaymentRecord[] {
  return getTaxpayerPayments(taxpayerId);
}

/**
 * Get taxpayer total paid amount
 */
export function getTotalPaid(taxpayerId: string): number {
  return getTaxpayerTotalPaid(taxpayerId);
}
