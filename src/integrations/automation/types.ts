// Automation System Types

export type AutomationRiskLevel = 'low' | 'medium' | 'high';
export type AutomationStatus = 'idle' | 'running' | 'paused';
export type NudgeAction = 'none' | 'sms_reminder' | 'sms_strong' | 'whatsapp_urgent';

export interface TaxpayerAutomationData {
  taxpayer_id: string;
  phone_number: string;
  due_date: string;
  payment_date: string | null;
  delay_days: number;
  arrears_amount: number;
  risk_category: AutomationRiskLevel;
  due_amount: number;
  tax_type: number;
  ward: number;
  zone: number;
}

export interface DelayBasedRule {
  minDays: number;
  maxDays: number;
  riskLevel: AutomationRiskLevel;
  action: NudgeAction;
  channel: 'sms' | 'whatsapp';
  messageTone: 'gentle' | 'firm' | 'urgent';
}

export interface AutomationResult {
  taxpayer_id: string;
  previous_risk: AutomationRiskLevel;
  current_risk: AutomationRiskLevel;
  delay_days: number;
  action_taken: NudgeAction;
  channel_used: 'sms' | 'whatsapp' | null;
  message_sent: boolean;
  nudge_blocked: boolean;
  timestamp: string;
}

export interface AutomationLog {
  id: string;
  taxpayer_id: string;
  event_type: 'risk_escalation' | 'nudge_sent' | 'payment_received' | 'nudge_blocked' | 'follow_up';
  old_risk?: AutomationRiskLevel;
  new_risk?: AutomationRiskLevel;
  channel?: 'sms' | 'whatsapp';
  message?: string;
  delay_days: number;
  timestamp: string;
  automated: boolean;
}

export interface SchedulerState {
  status: AutomationStatus;
  lastRunTime: string | null;
  nextRunTime: string | null;
  processedCount: number;
  nudgesSentCount: number;
  errors: string[];
}

export interface PaymentEvent {
  taxpayer_id: string;
  amount: number;
  payment_date: string;
  previous_arrears: number;
  new_arrears: number;
  risk_downgraded: boolean;
  nudges_stopped: boolean;
}
