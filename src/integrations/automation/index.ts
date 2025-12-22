// Automation Module Exports

export type {
  AutomationRiskLevel,
  AutomationStatus,
  NudgeAction,
  TaxpayerAutomationData,
  DelayBasedRule,
  AutomationResult,
  AutomationLog,
  SchedulerState,
  PaymentEvent,
} from './types';

export {
  DELAY_RULES,
  FOLLOW_UP_DAYS,
  getRuleForDelay,
  calculateDelayBasedRisk,
  getActionForDelay,
  getChannelForDelay,
  getMessageForDelay,
  getFollowUpMessage,
  needsFollowUp,
} from './delayRules';

export {
  subscribeToLogs,
  logRiskEscalation,
  logNudgeSent,
  logPaymentReceived,
  logNudgeBlocked,
  logFollowUp,
  getActivityLogs,
  getTaxpayerLogs,
  getLogsByType,
  getAutomatedLogs,
  getLogStats,
  clearActivityLogs,
  getRecentLogs,
} from './activityLog';

export {
  subscribeToScheduler,
  getSchedulerState,
  calculateCurrentDelay,
  hasTaxpayerPaid,
  processTaxpayer,
  processBatch,
  simulatePayment,
  resetPaymentStatus,
  getOverdueTaxpayers,
  getAutomationStats,
  triggerManualNudge,
} from './scheduler';
