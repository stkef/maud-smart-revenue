// Decision Engine - Pure business logic for determining communication strategy

import type { TaxpayerData, DecisionResult, RiskLevel, Channel, MessagePriority } from './types';

// Message templates for different risk levels
const MESSAGE_TEMPLATES = {
  high: {
    urgent: `🚨 URGENT: Your {tax_type} payment is significantly overdue. Immediate action required to avoid penalties. Please clear your dues at the earliest. Contact: Tax Office. Ref: {taxpayer_id}`,
    reminder: `Important: Your {tax_type} account shows high risk of default. Please prioritize payment to avoid legal action. Reference: {taxpayer_id}`,
  },
  medium: {
    reminder: `Reminder: Your {tax_type} payment is pending. Please clear your dues soon to avoid late fees. Reference: {taxpayer_id}`,
    notice: `Notice: A payment reminder for your {tax_type} account. Please ensure timely payment. Reference: {taxpayer_id}`,
  },
  low: {
    info: `Information: Thank you for being a regular taxpayer. Your next {tax_type} payment is due soon. Reference: {taxpayer_id}`,
    appreciation: `Thank you for your timely {tax_type} payments. Keep up the good compliance! Reference: {taxpayer_id}`,
  },
};

// Tax type names for personalization
const TAX_TYPE_NAMES: Record<number, string> = {
  0: 'Property Tax',
  1: 'Water Tax',
  2: 'Sewage Tax',
};

function getRiskLevel(probability: number): RiskLevel {
  if (probability > 0.6) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

function getChannelForRisk(riskLevel: RiskLevel): { primary: Channel; fallback?: Channel } {
  switch (riskLevel) {
    case 'high':
      return { primary: 'whatsapp', fallback: 'sms' };
    case 'medium':
      return { primary: 'sms' };
    case 'low':
      return { primary: 'sms' };
  }
}

function getPriorityForRisk(riskLevel: RiskLevel): MessagePriority {
  switch (riskLevel) {
    case 'high':
      return 'urgent';
    case 'medium':
      return 'normal';
    case 'low':
      return 'low';
  }
}

function generateMessage(taxpayer: TaxpayerData, riskLevel: RiskLevel): string {
  const taxType = TAX_TYPE_NAMES[taxpayer.tax_type] || 'Tax';
  let template: string;

  switch (riskLevel) {
    case 'high':
      template = MESSAGE_TEMPLATES.high.urgent;
      break;
    case 'medium':
      template = MESSAGE_TEMPLATES.medium.reminder;
      break;
    case 'low':
      template = MESSAGE_TEMPLATES.low.info;
      break;
  }

  // Replace placeholders
  return template
    .replace('{taxpayer_id}', taxpayer.taxpayer_id)
    .replace('{tax_type}', taxType)
    .replace('{ward}', String(taxpayer.ward))
    .replace('{zone}', String(taxpayer.zone));
}

/**
 * Decision Engine: Determines the optimal communication strategy for a taxpayer
 * @param taxpayer - The taxpayer data with risk information
 * @returns Decision result with channel, priority, and message
 */
export function makeDecision(taxpayer: TaxpayerData): DecisionResult {
  const riskLevel = getRiskLevel(taxpayer.default_risk_probability);
  const channels = getChannelForRisk(riskLevel);
  const priority = getPriorityForRisk(riskLevel);
  const message = generateMessage(taxpayer, riskLevel);

  return {
    channel: channels.primary,
    priority,
    message,
    fallbackChannel: channels.fallback,
  };
}

/**
 * Get custom message for specific scenarios
 */
export function getCustomMessage(
  taxpayer: TaxpayerData,
  messageType: 'urgent' | 'reminder' | 'notice' | 'info' | 'appreciation'
): string {
  const riskLevel = getRiskLevel(taxpayer.default_risk_probability);
  const templates = MESSAGE_TEMPLATES[riskLevel] as Record<string, string>;
  const template = templates[messageType] || templates[Object.keys(templates)[0]];
  
  return template
    .replace('{taxpayer_id}', taxpayer.taxpayer_id)
    .replace('{tax_type}', TAX_TYPE_NAMES[taxpayer.tax_type] || 'Tax');
}

/**
 * Batch decision making for multiple taxpayers
 */
export function makeBatchDecisions(taxpayers: TaxpayerData[]): Map<string, DecisionResult> {
  const decisions = new Map<string, DecisionResult>();
  
  for (const taxpayer of taxpayers) {
    decisions.set(taxpayer.taxpayer_id, makeDecision(taxpayer));
  }
  
  return decisions;
}

/**
 * Filter taxpayers that need urgent attention
 */
export function getHighRiskTaxpayers(taxpayers: TaxpayerData[]): TaxpayerData[] {
  return taxpayers.filter(tp => getRiskLevel(tp.default_risk_probability) === 'high');
}
