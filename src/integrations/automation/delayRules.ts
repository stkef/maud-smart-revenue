// Delay-Based Rules Engine for Automated Risk Escalation and Messaging

import type { DelayBasedRule, AutomationRiskLevel, NudgeAction } from './types';

/**
 * Delay-based automation rules:
 * 0-10 days → Low Risk (no action)
 * 11-30 days → Medium Risk → SMS reminder
 * 31-45 days → Medium Risk → Strong SMS reminder
 * 46+ days → High Risk → WhatsApp / urgent SMS
 */
export const DELAY_RULES: DelayBasedRule[] = [
  {
    minDays: 0,
    maxDays: 10,
    riskLevel: 'low',
    action: 'none',
    channel: 'sms',
    messageTone: 'gentle',
  },
  {
    minDays: 11,
    maxDays: 30,
    riskLevel: 'medium',
    action: 'sms_reminder',
    channel: 'sms',
    messageTone: 'gentle',
  },
  {
    minDays: 31,
    maxDays: 45,
    riskLevel: 'medium',
    action: 'sms_strong',
    channel: 'sms',
    messageTone: 'firm',
  },
  {
    minDays: 46,
    maxDays: Infinity,
    riskLevel: 'high',
    action: 'whatsapp_urgent',
    channel: 'whatsapp',
    messageTone: 'urgent',
  },
];

// Follow-up rules: send follow-up after X days if still pending
export const FOLLOW_UP_DAYS = 5;

/**
 * Get the applicable rule for a given delay
 */
export function getRuleForDelay(delayDays: number): DelayBasedRule {
  const rule = DELAY_RULES.find(
    (r) => delayDays >= r.minDays && delayDays <= r.maxDays
  );
  return rule || DELAY_RULES[0]; // Default to low risk
}

/**
 * Calculate risk level based on delay days
 */
export function calculateDelayBasedRisk(delayDays: number): AutomationRiskLevel {
  const rule = getRuleForDelay(delayDays);
  return rule.riskLevel;
}

/**
 * Determine the action to take based on delay
 */
export function getActionForDelay(delayDays: number): NudgeAction {
  const rule = getRuleForDelay(delayDays);
  return rule.action;
}

/**
 * Get channel to use based on delay
 */
export function getChannelForDelay(delayDays: number): 'sms' | 'whatsapp' {
  const rule = getRuleForDelay(delayDays);
  return rule.channel;
}

/**
 * Check if a follow-up is needed
 */
export function needsFollowUp(
  lastNudgeDate: string | null,
  isPaid: boolean
): boolean {
  if (isPaid || !lastNudgeDate) return false;
  
  const lastNudge = new Date(lastNudgeDate);
  const now = new Date();
  const daysSinceNudge = Math.floor(
    (now.getTime() - lastNudge.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceNudge >= FOLLOW_UP_DAYS;
}

/**
 * Get message template based on delay and tone
 */
export function getMessageForDelay(
  delayDays: number,
  taxpayerId: string,
  taxType: string,
  arrears: number
): string {
  const rule = getRuleForDelay(delayDays);
  const formattedArrears = `₹${Math.abs(arrears).toLocaleString()}`;
  
  switch (rule.messageTone) {
    case 'gentle':
      return `Gentle Reminder: Your ${taxType} payment is ${delayDays} days overdue. Outstanding: ${formattedArrears}. Please pay at the earliest. Ref: ${taxpayerId}`;
    
    case 'firm':
      return `Important Notice: Your ${taxType} is now ${delayDays} days overdue! Amount due: ${formattedArrears}. Immediate payment required to avoid penalties. Ref: ${taxpayerId}`;
    
    case 'urgent':
      return `🚨 URGENT: Your ${taxType} payment is critically overdue (${delayDays} days). Total dues: ${formattedArrears}. Legal action may be initiated. Pay immediately. Contact Tax Office. Ref: ${taxpayerId}`;
    
    default:
      return `Payment Reminder: ${taxType} outstanding amount ${formattedArrears}. Ref: ${taxpayerId}`;
  }
}

/**
 * Get follow-up message
 */
export function getFollowUpMessage(
  delayDays: number,
  taxpayerId: string,
  taxType: string,
  arrears: number,
  attemptNumber: number
): string {
  const formattedArrears = `₹${Math.abs(arrears).toLocaleString()}`;
  
  if (attemptNumber >= 3) {
    return `⚠️ Final Notice (Attempt ${attemptNumber}): Your ${taxType} payment is ${delayDays} days overdue. Amount: ${formattedArrears}. This is your final reminder before escalation. Ref: ${taxpayerId}`;
  }
  
  return `Follow-up (Attempt ${attemptNumber}): Your ${taxType} payment of ${formattedArrears} remains unpaid after ${delayDays} days. Please settle immediately. Ref: ${taxpayerId}`;
}
