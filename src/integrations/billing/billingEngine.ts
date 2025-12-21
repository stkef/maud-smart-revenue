// Billing Engine - Core billing logic for tax calculations

import type { BillingInput, BillingResult, PaymentStatus, PenaltyConfig } from './types';

// Default penalty configuration
const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  dailyRate: 0.02, // 2% per day
  maxPenaltyPercent: 1.0, // Cap at 100% of due amount
  gracePeriodDays: 0, // No grace period by default
};

/**
 * Calculate the number of delay days between due date and payment/current date
 */
function calculateDelayDays(dueDate: Date, paymentDate?: Date): number {
  const effectiveDate = paymentDate || new Date();
  const diffTime = effectiveDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate penalty based on delay days and due amount
 * Formula: penalty = delay_days × daily_rate × due_amount
 */
function calculatePenalty(
  dueAmount: number,
  delayDays: number,
  config: PenaltyConfig = DEFAULT_PENALTY_CONFIG
): { penaltyAmount: number; penaltyRate: number } {
  // Apply grace period
  const effectiveDelayDays = Math.max(0, delayDays - config.gracePeriodDays);
  
  if (effectiveDelayDays === 0) {
    return { penaltyAmount: 0, penaltyRate: 0 };
  }

  // Calculate raw penalty
  const rawPenalty = effectiveDelayDays * config.dailyRate * dueAmount;
  
  // Apply maximum cap
  const maxPenalty = dueAmount * config.maxPenaltyPercent;
  const penaltyAmount = Math.min(rawPenalty, maxPenalty);
  
  // Calculate effective rate
  const penaltyRate = dueAmount > 0 ? penaltyAmount / dueAmount : 0;

  return {
    penaltyAmount: Math.round(penaltyAmount * 100) / 100,
    penaltyRate: Math.round(penaltyRate * 10000) / 10000,
  };
}

/**
 * Determine payment status based on amounts and timing
 */
function determineStatus(
  totalDue: number,
  paidAmount: number,
  delayDays: number
): PaymentStatus {
  if (paidAmount >= totalDue) {
    return 'paid';
  }
  if (paidAmount > 0 && paidAmount < totalDue) {
    return 'partial';
  }
  if (delayDays > 0) {
    return 'overdue';
  }
  return 'on-time';
}

/**
 * Main billing calculation function
 * Calculates total due, penalties, arrears, and payment status
 */
export function calculateBilling(
  input: BillingInput,
  config: PenaltyConfig = DEFAULT_PENALTY_CONFIG
): BillingResult {
  const delayDays = calculateDelayDays(input.dueDate, input.paymentDate);
  const { penaltyAmount, penaltyRate } = calculatePenalty(input.dueAmount, delayDays, config);
  
  // Calculate total due: due_amount + arrears + penalty
  const totalDue = input.dueAmount + input.arrearsAmount + penaltyAmount;
  const remainingBalance = Math.max(0, totalDue - input.paidAmount);
  
  const status = determineStatus(totalDue, input.paidAmount, delayDays);

  return {
    taxpayerId: input.taxpayerId,
    dueAmount: input.dueAmount,
    arrearsAmount: input.arrearsAmount,
    paidAmount: input.paidAmount,
    delayDays,
    penaltyRate,
    penaltyAmount,
    totalDue,
    remainingBalance,
    status,
    isOverdue: delayDays > 0,
    breakdown: {
      principal: input.dueAmount,
      arrears: input.arrearsAmount,
      penalty: penaltyAmount,
      paid: input.paidAmount,
      balance: remainingBalance,
    },
  };
}

/**
 * Batch billing calculation for multiple taxpayers
 */
export function calculateBatchBilling(
  inputs: BillingInput[],
  config?: PenaltyConfig
): Map<string, BillingResult> {
  const results = new Map<string, BillingResult>();
  
  for (const input of inputs) {
    results.set(input.taxpayerId, calculateBilling(input, config));
  }
  
  return results;
}

/**
 * Get overdue taxpayers from billing results
 */
export function getOverdueTaxpayers(results: Map<string, BillingResult>): BillingResult[] {
  return Array.from(results.values()).filter(r => r.isOverdue);
}

/**
 * Calculate aggregate billing statistics
 */
export function calculateBillingStats(results: Map<string, BillingResult>): {
  totalDue: number;
  totalPaid: number;
  totalPenalties: number;
  totalArrears: number;
  overdueCount: number;
  paidCount: number;
  partialCount: number;
  collectionRate: number;
} {
  let totalDue = 0;
  let totalPaid = 0;
  let totalPenalties = 0;
  let totalArrears = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let partialCount = 0;

  for (const result of results.values()) {
    totalDue += result.totalDue;
    totalPaid += result.paidAmount;
    totalPenalties += result.penaltyAmount;
    totalArrears += result.arrearsAmount;
    
    if (result.status === 'overdue') overdueCount++;
    if (result.status === 'paid') paidCount++;
    if (result.status === 'partial') partialCount++;
  }

  const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return {
    totalDue,
    totalPaid,
    totalPenalties,
    totalArrears,
    overdueCount,
    paidCount,
    partialCount,
    collectionRate: Math.round(collectionRate * 100) / 100,
  };
}

/**
 * Re-export types and config
 */
export { DEFAULT_PENALTY_CONFIG };
export type { BillingInput, BillingResult, PaymentStatus, PenaltyConfig };
