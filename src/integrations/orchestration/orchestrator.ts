// Orchestration Layer - Coordinates billing, payments, and messaging

import { calculateBilling, type BillingResult, type BillingInput } from '../billing';
import { processPayment, type PaymentRequest, type PaymentResponse } from '../payment';
import { makeDecision } from '../messaging/decisionEngine';
import { sendNotification } from '../messaging/notificationService';
import type { TaxpayerData, DecisionResult, NotificationResult } from '../messaging/types';

export interface TaxpayerOrchestrationData {
  taxpayerId: string;
  name?: string;
  phone?: string;
  ward: number;
  zone: number;
  taxType: number;
  dueAmount: number;
  arrearsAmount: number;
  paidAmount: number;
  dueDate: Date;
  riskProbability: number;
  riskCategory: string;
}

export interface OrchestrationResult {
  taxpayerId: string;
  billing: BillingResult;
  decision: DecisionResult;
  shouldNudge: boolean;
  nudgeBlocked: boolean;
  blockReason?: string;
}

// Track nudge blocks (after payment, etc.)
const nudgeBlockList = new Set<string>();

/**
 * Block nudges for a taxpayer (e.g., after successful payment)
 */
export function blockNudges(taxpayerId: string, reason: string): void {
  nudgeBlockList.add(taxpayerId);
  console.log(`[ORCHESTRATOR] Nudges blocked for ${taxpayerId}: ${reason}`);
}

/**
 * Unblock nudges for a taxpayer
 */
export function unblockNudges(taxpayerId: string): void {
  nudgeBlockList.delete(taxpayerId);
  console.log(`[ORCHESTRATOR] Nudges unblocked for ${taxpayerId}`);
}

/**
 * Check if nudges are blocked for a taxpayer
 */
export function isNudgeBlocked(taxpayerId: string): boolean {
  return nudgeBlockList.has(taxpayerId);
}

/**
 * Main orchestration: Calculate billing, determine nudge strategy
 */
export function orchestrateTaxpayer(data: TaxpayerOrchestrationData): OrchestrationResult {
  // Step 1: Calculate billing
  const billingInput: BillingInput = {
    taxpayerId: data.taxpayerId,
    dueAmount: data.dueAmount,
    arrearsAmount: data.arrearsAmount,
    paidAmount: data.paidAmount,
    dueDate: data.dueDate,
  };
  const billing = calculateBilling(billingInput);

  // Step 2: Prepare taxpayer data for decision engine
  const taxpayerData: TaxpayerData = {
    taxpayer_id: data.taxpayerId,
    name: data.name,
    phone: data.phone,
    ward: data.ward,
    zone: data.zone,
    tax_type: data.taxType,
    default_risk_probability: data.riskProbability,
    risk_category: data.riskCategory,
    due_amount: billing.totalDue,
    arrears_amount: billing.arrearsAmount,
  };
  const decision = makeDecision(taxpayerData);

  // Step 3: Determine if nudge should be sent
  const nudgeBlocked = isNudgeBlocked(data.taxpayerId);
  const shouldNudge = billing.isOverdue && !nudgeBlocked && billing.remainingBalance > 0;

  return {
    taxpayerId: data.taxpayerId,
    billing,
    decision,
    shouldNudge,
    nudgeBlocked,
    blockReason: nudgeBlocked ? 'Payment received or manually blocked' : undefined,
  };
}

/**
 * Execute nudge for a taxpayer
 */
export async function executeNudge(
  data: TaxpayerOrchestrationData,
  customMessage?: string
): Promise<NotificationResult | null> {
  const result = orchestrateTaxpayer(data);

  if (!result.shouldNudge) {
    console.log(`[ORCHESTRATOR] Nudge skipped for ${data.taxpayerId}: ${result.blockReason || 'Not overdue'}`);
    return null;
  }

  const taxpayerData: TaxpayerData = {
    taxpayer_id: data.taxpayerId,
    name: data.name,
    phone: data.phone,
    ward: data.ward,
    zone: data.zone,
    tax_type: data.taxType,
    default_risk_probability: data.riskProbability,
    risk_category: data.riskCategory,
    due_amount: result.billing.totalDue,
    arrears_amount: result.billing.arrearsAmount,
  };

  return sendNotification(taxpayerData, customMessage);
}

/**
 * Process payment with full orchestration
 */
export async function processPaymentWithOrchestration(
  taxpayerId: string,
  request: PaymentRequest
): Promise<PaymentResponse> {
  const response = await processPayment(request, {
    onSuccess: () => {
      // Block further nudges after successful payment
      blockNudges(taxpayerId, 'Payment received');
    },
    onArrearsReduced: (id, newTotal) => {
      console.log(`[ORCHESTRATOR] Arrears updated for ${id}: ₹${newTotal}`);
    },
    onRiskRecalculation: (id) => {
      console.log(`[ORCHESTRATOR] Risk recalculation triggered for ${id}`);
    },
    onStopNudges: (id) => {
      console.log(`[ORCHESTRATOR] Nudges stopped for ${id}`);
    },
  });

  return response;
}

/**
 * Batch orchestration for multiple taxpayers
 */
export function orchestrateBatch(
  taxpayers: TaxpayerOrchestrationData[]
): Map<string, OrchestrationResult> {
  const results = new Map<string, OrchestrationResult>();

  for (const taxpayer of taxpayers) {
    results.set(taxpayer.taxpayerId, orchestrateTaxpayer(taxpayer));
  }

  return results;
}

/**
 * Get taxpayers requiring nudges
 */
export function getTaxpayersRequiringNudges(
  results: Map<string, OrchestrationResult>
): OrchestrationResult[] {
  return Array.from(results.values()).filter(r => r.shouldNudge);
}
