// Activity Log System - Tracks all automated events

import type { AutomationLog, AutomationRiskLevel } from './types';

// In-memory store for activity logs
let activityLogs: AutomationLog[] = [];
let logListeners: Set<() => void> = new Set();

function notifyLogListeners() {
  logListeners.forEach((fn) => fn());
}

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a listener for log updates
 */
export function subscribeToLogs(listener: () => void): () => void {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

/**
 * Log a risk escalation event
 */
export function logRiskEscalation(
  taxpayerId: string,
  oldRisk: AutomationRiskLevel,
  newRisk: AutomationRiskLevel,
  delayDays: number,
  automated: boolean = true
): AutomationLog {
  const log: AutomationLog = {
    id: generateLogId(),
    taxpayer_id: taxpayerId,
    event_type: 'risk_escalation',
    old_risk: oldRisk,
    new_risk: newRisk,
    delay_days: delayDays,
    timestamp: new Date().toISOString(),
    automated,
  };
  
  activityLogs = [log, ...activityLogs];
  notifyLogListeners();
  console.log(`[ACTIVITY LOG] Risk escalation: ${taxpayerId} ${oldRisk} → ${newRisk}`);
  
  return log;
}

/**
 * Log a nudge sent event
 */
export function logNudgeSent(
  taxpayerId: string,
  channel: 'sms' | 'whatsapp',
  message: string,
  delayDays: number,
  automated: boolean = true
): AutomationLog {
  const log: AutomationLog = {
    id: generateLogId(),
    taxpayer_id: taxpayerId,
    event_type: 'nudge_sent',
    channel,
    message,
    delay_days: delayDays,
    timestamp: new Date().toISOString(),
    automated,
  };
  
  activityLogs = [log, ...activityLogs];
  notifyLogListeners();
  console.log(`[ACTIVITY LOG] Nudge sent: ${taxpayerId} via ${channel}`);
  
  return log;
}

/**
 * Log a payment received event
 */
export function logPaymentReceived(
  taxpayerId: string,
  amount: number,
  previousRisk: AutomationRiskLevel,
  delayDays: number
): AutomationLog {
  const log: AutomationLog = {
    id: generateLogId(),
    taxpayer_id: taxpayerId,
    event_type: 'payment_received',
    old_risk: previousRisk,
    new_risk: 'low',
    message: `Payment of ₹${amount.toLocaleString()} received`,
    delay_days: delayDays,
    timestamp: new Date().toISOString(),
    automated: false,
  };
  
  activityLogs = [log, ...activityLogs];
  notifyLogListeners();
  console.log(`[ACTIVITY LOG] Payment received: ${taxpayerId} - ₹${amount}`);
  
  return log;
}

/**
 * Log a nudge blocked event
 */
export function logNudgeBlocked(
  taxpayerId: string,
  reason: string,
  delayDays: number
): AutomationLog {
  const log: AutomationLog = {
    id: generateLogId(),
    taxpayer_id: taxpayerId,
    event_type: 'nudge_blocked',
    message: reason,
    delay_days: delayDays,
    timestamp: new Date().toISOString(),
    automated: true,
  };
  
  activityLogs = [log, ...activityLogs];
  notifyLogListeners();
  console.log(`[ACTIVITY LOG] Nudge blocked: ${taxpayerId} - ${reason}`);
  
  return log;
}

/**
 * Log a follow-up event
 */
export function logFollowUp(
  taxpayerId: string,
  channel: 'sms' | 'whatsapp',
  attemptNumber: number,
  delayDays: number
): AutomationLog {
  const log: AutomationLog = {
    id: generateLogId(),
    taxpayer_id: taxpayerId,
    event_type: 'follow_up',
    channel,
    message: `Follow-up attempt #${attemptNumber}`,
    delay_days: delayDays,
    timestamp: new Date().toISOString(),
    automated: true,
  };
  
  activityLogs = [log, ...activityLogs];
  notifyLogListeners();
  console.log(`[ACTIVITY LOG] Follow-up: ${taxpayerId} attempt #${attemptNumber}`);
  
  return log;
}

/**
 * Get all activity logs
 */
export function getActivityLogs(): AutomationLog[] {
  return [...activityLogs];
}

/**
 * Get logs for a specific taxpayer
 */
export function getTaxpayerLogs(taxpayerId: string): AutomationLog[] {
  return activityLogs.filter((log) => log.taxpayer_id === taxpayerId);
}

/**
 * Get logs by event type
 */
export function getLogsByType(eventType: AutomationLog['event_type']): AutomationLog[] {
  return activityLogs.filter((log) => log.event_type === eventType);
}

/**
 * Get automated logs only
 */
export function getAutomatedLogs(): AutomationLog[] {
  return activityLogs.filter((log) => log.automated);
}

/**
 * Get log statistics
 */
export function getLogStats(): {
  total: number;
  automatedNudges: number;
  manualNudges: number;
  escalations: number;
  payments: number;
  blocked: number;
  followUps: number;
} {
  const automatedNudges = activityLogs.filter(
    (l) => l.event_type === 'nudge_sent' && l.automated
  ).length;
  const manualNudges = activityLogs.filter(
    (l) => l.event_type === 'nudge_sent' && !l.automated
  ).length;
  
  return {
    total: activityLogs.length,
    automatedNudges,
    manualNudges,
    escalations: activityLogs.filter((l) => l.event_type === 'risk_escalation').length,
    payments: activityLogs.filter((l) => l.event_type === 'payment_received').length,
    blocked: activityLogs.filter((l) => l.event_type === 'nudge_blocked').length,
    followUps: activityLogs.filter((l) => l.event_type === 'follow_up').length,
  };
}

/**
 * Clear all logs
 */
export function clearActivityLogs(): void {
  activityLogs = [];
  notifyLogListeners();
}

/**
 * Get recent logs (last N entries)
 */
export function getRecentLogs(count: number = 50): AutomationLog[] {
  return activityLogs.slice(0, count);
}
