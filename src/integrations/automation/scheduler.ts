// Automation Scheduler Service - Time-driven workflow automation

import type {
  TaxpayerAutomationData,
  AutomationResult,
  SchedulerState,
  AutomationRiskLevel,
  PaymentEvent,
} from './types';
import {
  calculateDelayBasedRisk,
  getActionForDelay,
  getChannelForDelay,
  getMessageForDelay,
  getFollowUpMessage,
  needsFollowUp,
  FOLLOW_UP_DAYS,
} from './delayRules';
import {
  logRiskEscalation,
  logNudgeSent,
  logPaymentReceived,
  logNudgeBlocked,
  logFollowUp,
} from './activityLog';
import { sendNotification } from '@/integrations/messaging/notificationService';
import { blockNudges, isNudgeBlocked, unblockNudges } from '@/integrations/orchestration';

// Tax type names
const TAX_TYPE_NAMES: Record<number, string> = {
  0: 'Property Tax',
  1: 'Water Tax',
  2: 'Sewage Tax',
};

// Scheduler state
let schedulerState: SchedulerState = {
  status: 'idle',
  lastRunTime: null,
  nextRunTime: null,
  processedCount: 0,
  nudgesSentCount: 0,
  errors: [],
};

// Track last nudge dates per taxpayer
const lastNudgeDates: Map<string, string> = new Map();
const nudgeAttempts: Map<string, number> = new Map();

// Paid taxpayers set
const paidTaxpayers: Set<string> = new Set();

let schedulerListeners: Set<() => void> = new Set();

function notifySchedulerListeners() {
  schedulerListeners.forEach((fn) => fn());
}

/**
 * Subscribe to scheduler state changes
 */
export function subscribeToScheduler(listener: () => void): () => void {
  schedulerListeners.add(listener);
  return () => schedulerListeners.delete(listener);
}

/**
 * Get current scheduler state
 */
export function getSchedulerState(): SchedulerState {
  return { ...schedulerState };
}

/**
 * Calculate delay days from due date
 */
export function calculateCurrentDelay(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Check if taxpayer has paid
 */
export function hasTaxpayerPaid(taxpayerId: string): boolean {
  return paidTaxpayers.has(taxpayerId);
}

/**
 * Process a single taxpayer through the automation workflow
 */
export async function processTaxpayer(
  taxpayer: TaxpayerAutomationData
): Promise<AutomationResult> {
  const { taxpayer_id, due_date, arrears_amount, tax_type } = taxpayer;
  
  // Calculate current delay from due date
  const currentDelay = calculateCurrentDelay(due_date);
  
  // Get previous risk (from data or calculate)
  const previousRisk = taxpayer.risk_category || calculateDelayBasedRisk(0);
  
  // Calculate new risk based on delay
  const newRisk = calculateDelayBasedRisk(currentDelay);
  
  // Check if taxpayer has already paid
  if (hasTaxpayerPaid(taxpayer_id)) {
    return {
      taxpayer_id,
      previous_risk: previousRisk,
      current_risk: 'low',
      delay_days: currentDelay,
      action_taken: 'none',
      channel_used: null,
      message_sent: false,
      nudge_blocked: true,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Check if nudges are blocked
  if (isNudgeBlocked(taxpayer_id)) {
    logNudgeBlocked(taxpayer_id, 'Nudges blocked for this taxpayer', currentDelay);
    return {
      taxpayer_id,
      previous_risk: previousRisk,
      current_risk: newRisk,
      delay_days: currentDelay,
      action_taken: 'none',
      channel_used: null,
      message_sent: false,
      nudge_blocked: true,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Log risk escalation if changed
  if (previousRisk !== newRisk) {
    logRiskEscalation(taxpayer_id, previousRisk, newRisk, currentDelay);
  }
  
  // Get action and channel
  const action = getActionForDelay(currentDelay);
  const channel = getChannelForDelay(currentDelay);
  
  // Check if no action needed (0-10 days)
  if (action === 'none') {
    return {
      taxpayer_id,
      previous_risk: previousRisk,
      current_risk: newRisk,
      delay_days: currentDelay,
      action_taken: action,
      channel_used: null,
      message_sent: false,
      nudge_blocked: false,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Check if follow-up is needed
  const lastNudge = lastNudgeDates.get(taxpayer_id);
  const isFollowUp = needsFollowUp(lastNudge || null, false);
  
  // Get message
  const taxTypeName = TAX_TYPE_NAMES[tax_type] || 'Tax';
  let message: string;
  let attemptNumber = nudgeAttempts.get(taxpayer_id) || 0;
  
  if (isFollowUp) {
    attemptNumber++;
    nudgeAttempts.set(taxpayer_id, attemptNumber);
    message = getFollowUpMessage(currentDelay, taxpayer_id, taxTypeName, arrears_amount, attemptNumber);
    logFollowUp(taxpayer_id, channel, attemptNumber, currentDelay);
  } else if (!lastNudge) {
    attemptNumber = 1;
    nudgeAttempts.set(taxpayer_id, attemptNumber);
    message = getMessageForDelay(currentDelay, taxpayer_id, taxTypeName, arrears_amount);
  } else {
    // Already sent initial nudge, not time for follow-up yet
    return {
      taxpayer_id,
      previous_risk: previousRisk,
      current_risk: newRisk,
      delay_days: currentDelay,
      action_taken: action,
      channel_used: null,
      message_sent: false,
      nudge_blocked: false,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Send the nudge through messaging integration
  try {
    const taxpayerData = {
      taxpayer_id,
      phone: taxpayer.phone_number || '+919999999999',
      default_risk_probability: newRisk === 'high' ? 0.8 : newRisk === 'medium' ? 0.5 : 0.2,
      tax_type,
      ward: taxpayer.ward,
      zone: taxpayer.zone,
    };
    
    await sendNotification(taxpayerData as any, message, channel);
    
    // Update tracking
    lastNudgeDates.set(taxpayer_id, new Date().toISOString());
    
    // Log the nudge
    logNudgeSent(taxpayer_id, channel, message, currentDelay, true);
    
    return {
      taxpayer_id,
      previous_risk: previousRisk,
      current_risk: newRisk,
      delay_days: currentDelay,
      action_taken: action,
      channel_used: channel,
      message_sent: true,
      nudge_blocked: false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[SCHEDULER] Failed to send nudge to ${taxpayer_id}:`, error);
    schedulerState.errors.push(`Failed to send nudge to ${taxpayer_id}`);
    
    return {
      taxpayer_id,
      previous_risk: previousRisk,
      current_risk: newRisk,
      delay_days: currentDelay,
      action_taken: action,
      channel_used: null,
      message_sent: false,
      nudge_blocked: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Process a batch of taxpayers
 */
export async function processBatch(
  taxpayers: TaxpayerAutomationData[],
  onProgress?: (current: number, total: number, result: AutomationResult) => void
): Promise<AutomationResult[]> {
  console.log(`[SCHEDULER] Processing batch of ${taxpayers.length} taxpayers`);
  
  schedulerState = {
    ...schedulerState,
    status: 'running',
    lastRunTime: new Date().toISOString(),
    processedCount: 0,
    nudgesSentCount: 0,
    errors: [],
  };
  notifySchedulerListeners();
  
  const results: AutomationResult[] = [];
  
  for (let i = 0; i < taxpayers.length; i++) {
    const taxpayer = taxpayers[i];
    const result = await processTaxpayer(taxpayer);
    results.push(result);
    
    schedulerState.processedCount++;
    if (result.message_sent) {
      schedulerState.nudgesSentCount++;
    }
    
    onProgress?.(i + 1, taxpayers.length, result);
    
    // Small delay between messages to avoid rate limiting
    if (result.message_sent) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  
  schedulerState = {
    ...schedulerState,
    status: 'idle',
    nextRunTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next day
  };
  notifySchedulerListeners();
  
  console.log(`[SCHEDULER] Batch complete. Processed: ${results.length}, Nudges sent: ${schedulerState.nudgesSentCount}`);
  
  return results;
}

/**
 * Simulate payment and update automation state
 */
export function simulatePayment(
  taxpayerId: string,
  amount: number,
  currentRisk: AutomationRiskLevel,
  currentArrears: number,
  delayDays: number
): PaymentEvent {
  // Mark taxpayer as paid
  paidTaxpayers.add(taxpayerId);
  
  // Block future nudges
  blockNudges(taxpayerId, 'Payment received');
  
  // Clear nudge tracking
  lastNudgeDates.delete(taxpayerId);
  nudgeAttempts.delete(taxpayerId);
  
  // Log the payment
  logPaymentReceived(taxpayerId, amount, currentRisk, delayDays);
  
  const event: PaymentEvent = {
    taxpayer_id: taxpayerId,
    amount,
    payment_date: new Date().toISOString(),
    previous_arrears: currentArrears,
    new_arrears: Math.max(0, currentArrears - amount),
    risk_downgraded: currentRisk !== 'low',
    nudges_stopped: true,
  };
  
  console.log(`[SCHEDULER] Payment simulated for ${taxpayerId}: ₹${amount}`);
  notifySchedulerListeners();
  
  return event;
}

/**
 * Reset payment status (for demo purposes)
 */
export function resetPaymentStatus(taxpayerId: string): void {
  paidTaxpayers.delete(taxpayerId);
  unblockNudges(taxpayerId);
  console.log(`[SCHEDULER] Payment status reset for ${taxpayerId}`);
  notifySchedulerListeners();
}

/**
 * Get overdue taxpayers that need action
 */
export function getOverdueTaxpayers(
  taxpayers: TaxpayerAutomationData[]
): TaxpayerAutomationData[] {
  return taxpayers.filter((tp) => {
    const delay = calculateCurrentDelay(tp.due_date);
    return delay > 10 && !hasTaxpayerPaid(tp.taxpayer_id);
  });
}

/**
 * Get statistics about the current state
 */
export function getAutomationStats(taxpayers: TaxpayerAutomationData[]): {
  totalOverdue: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  pendingNudges: number;
  paidCount: number;
} {
  let lowRisk = 0;
  let mediumRisk = 0;
  let highRisk = 0;
  let pendingNudges = 0;
  
  taxpayers.forEach((tp) => {
    if (hasTaxpayerPaid(tp.taxpayer_id)) return;
    
    const delay = calculateCurrentDelay(tp.due_date);
    const risk = calculateDelayBasedRisk(delay);
    
    if (risk === 'low') lowRisk++;
    else if (risk === 'medium') mediumRisk++;
    else highRisk++;
    
    if (delay > 10 && !lastNudgeDates.has(tp.taxpayer_id)) {
      pendingNudges++;
    }
  });
  
  return {
    totalOverdue: mediumRisk + highRisk,
    lowRisk,
    mediumRisk,
    highRisk,
    pendingNudges,
    paidCount: paidTaxpayers.size,
  };
}

/**
 * Manual trigger for a single taxpayer nudge
 */
export async function triggerManualNudge(
  taxpayer: TaxpayerAutomationData,
  customMessage?: string
): Promise<AutomationResult> {
  const currentDelay = calculateCurrentDelay(taxpayer.due_date);
  const channel = getChannelForDelay(currentDelay);
  const taxTypeName = TAX_TYPE_NAMES[taxpayer.tax_type] || 'Tax';
  
  const message = customMessage || 
    getMessageForDelay(currentDelay, taxpayer.taxpayer_id, taxTypeName, taxpayer.arrears_amount);
  
  try {
    const taxpayerData = {
      taxpayer_id: taxpayer.taxpayer_id,
      phone: taxpayer.phone_number || '+919999999999',
      default_risk_probability: 0.5,
      tax_type: taxpayer.tax_type,
      ward: taxpayer.ward,
      zone: taxpayer.zone,
    };
    
    await sendNotification(taxpayerData as any, message, channel);
    
    lastNudgeDates.set(taxpayer.taxpayer_id, new Date().toISOString());
    logNudgeSent(taxpayer.taxpayer_id, channel, message, currentDelay, false);
    
    return {
      taxpayer_id: taxpayer.taxpayer_id,
      previous_risk: taxpayer.risk_category,
      current_risk: calculateDelayBasedRisk(currentDelay),
      delay_days: currentDelay,
      action_taken: getActionForDelay(currentDelay),
      channel_used: channel,
      message_sent: true,
      nudge_blocked: false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[SCHEDULER] Manual nudge failed for ${taxpayer.taxpayer_id}:`, error);
    throw error;
  }
}
