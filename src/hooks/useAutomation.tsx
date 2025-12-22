// React Hook for Automation System

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  subscribeToScheduler,
  subscribeToLogs,
  getSchedulerState,
  getActivityLogs,
  getLogStats,
  getAutomationStats,
  processBatch,
  simulatePayment,
  resetPaymentStatus,
  triggerManualNudge,
  calculateCurrentDelay,
  calculateDelayBasedRisk,
  hasTaxpayerPaid,
  type TaxpayerAutomationData,
  type AutomationResult,
  type AutomationLog,
  type SchedulerState,
  type PaymentEvent,
} from '@/integrations/automation';
import { type LocalTaxpayer } from '@/hooks/useLocalTaxpayers';

export interface AutomationHookReturn {
  // State
  schedulerState: SchedulerState;
  activityLogs: AutomationLog[];
  logStats: ReturnType<typeof getLogStats>;
  isProcessing: boolean;
  progress: { current: number; total: number } | null;
  
  // Actions
  runAutomation: (taxpayers: LocalTaxpayer[]) => Promise<AutomationResult[]>;
  simulatePaymentForTaxpayer: (taxpayer: LocalTaxpayer, amount: number) => PaymentEvent;
  resetTaxpayerPayment: (taxpayerId: string) => void;
  sendManualNudge: (taxpayer: LocalTaxpayer, customMessage?: string) => Promise<AutomationResult>;
  
  // Utilities
  getTaxpayerDelay: (dueDate: string) => number;
  getTaxpayerRisk: (dueDate: string) => 'low' | 'medium' | 'high';
  isTaxpayerPaid: (taxpayerId: string) => boolean;
  getStats: (taxpayers: LocalTaxpayer[]) => ReturnType<typeof getAutomationStats>;
}

function convertToAutomationData(taxpayer: LocalTaxpayer): TaxpayerAutomationData {
  return {
    taxpayer_id: taxpayer.taxpayer_id,
    phone_number: taxpayer.phone || '+919999999999',
    due_date: taxpayer.due_date,
    payment_date: taxpayer.payment_date || null,
    delay_days: taxpayer.delay_days,
    arrears_amount: taxpayer.arrears_amount,
    risk_category: taxpayer.riskLevel,
    due_amount: taxpayer.due_amount,
    tax_type: taxpayer.tax_type,
    ward: taxpayer.ward,
    zone: taxpayer.zone,
  };
}

export function useAutomation(): AutomationHookReturn {
  const [schedulerState, setSchedulerState] = useState<SchedulerState>(getSchedulerState());
  const [activityLogs, setActivityLogs] = useState<AutomationLog[]>(getActivityLogs());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubScheduler = subscribeToScheduler(() => {
      setSchedulerState(getSchedulerState());
    });
    
    const unsubLogs = subscribeToLogs(() => {
      setActivityLogs(getActivityLogs());
    });
    
    return () => {
      unsubScheduler();
      unsubLogs();
    };
  }, []);
  
  const logStats = useMemo(() => getLogStats(), [activityLogs]);
  
  const runAutomation = useCallback(async (taxpayers: LocalTaxpayer[]): Promise<AutomationResult[]> => {
    setIsProcessing(true);
    setProgress({ current: 0, total: taxpayers.length });
    
    try {
      const automationData = taxpayers.map(convertToAutomationData);
      
      const results = await processBatch(automationData, (current, total, result) => {
        setProgress({ current, total });
      });
      
      return results;
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);
  
  const simulatePaymentForTaxpayer = useCallback((taxpayer: LocalTaxpayer, amount: number): PaymentEvent => {
    const delay = calculateCurrentDelay(taxpayer.due_date);
    return simulatePayment(
      taxpayer.taxpayer_id,
      amount,
      taxpayer.riskLevel,
      taxpayer.arrears_amount,
      delay
    );
  }, []);
  
  const resetTaxpayerPayment = useCallback((taxpayerId: string): void => {
    resetPaymentStatus(taxpayerId);
  }, []);
  
  const sendManualNudge = useCallback(async (taxpayer: LocalTaxpayer, customMessage?: string): Promise<AutomationResult> => {
    const automationData = convertToAutomationData(taxpayer);
    return triggerManualNudge(automationData, customMessage);
  }, []);
  
  const getTaxpayerDelay = useCallback((dueDate: string): number => {
    return calculateCurrentDelay(dueDate);
  }, []);
  
  const getTaxpayerRisk = useCallback((dueDate: string): 'low' | 'medium' | 'high' => {
    const delay = calculateCurrentDelay(dueDate);
    return calculateDelayBasedRisk(delay);
  }, []);
  
  const isTaxpayerPaid = useCallback((taxpayerId: string): boolean => {
    return hasTaxpayerPaid(taxpayerId);
  }, []);
  
  const getStats = useCallback((taxpayers: LocalTaxpayer[]) => {
    const automationData = taxpayers.map(convertToAutomationData);
    return getAutomationStats(automationData);
  }, []);
  
  return {
    schedulerState,
    activityLogs,
    logStats,
    isProcessing,
    progress,
    runAutomation,
    simulatePaymentForTaxpayer,
    resetTaxpayerPayment,
    sendManualNudge,
    getTaxpayerDelay,
    getTaxpayerRisk,
    isTaxpayerPaid,
    getStats,
  };
}
