import { useState, useCallback, useMemo } from 'react';
import { 
  sendNotification, 
  sendBatchNotifications,
  sendHighRiskNotifications,
  getProviderInfo,
  type TaxpayerData,
  type NotificationResult,
  type Channel,
} from '@/integrations/messaging';
import { LocalTaxpayer } from './useLocalTaxpayers';

export interface NudgeState {
  taxpayerId: string;
  status: 'pending' | 'sent' | 'failed';
  result?: NotificationResult;
}

// Global state for nudge tracking
let nudgeStateMap = new Map<string, NudgeState>();
let listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function useMessagingIntegration() {
  const [, forceUpdate] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);

  // Subscribe to state changes
  useMemo(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Convert LocalTaxpayer to TaxpayerData format
  const toTaxpayerData = useCallback((taxpayer: LocalTaxpayer): TaxpayerData => ({
    taxpayer_id: taxpayer.taxpayer_id,
    name: taxpayer.name,
    phone: taxpayer.phone,
    ward: taxpayer.ward,
    zone: taxpayer.zone,
    tax_type: taxpayer.tax_type,
    default_risk_probability: taxpayer.default_risk_probability,
    risk_category: taxpayer.risk_category,
    due_amount: taxpayer.due_amount,
    arrears_amount: taxpayer.arrears_amount,
  }), []);

  // Send nudge to a single taxpayer
  const sendNudge = useCallback(async (
    taxpayer: LocalTaxpayer,
    customMessage?: string,
    forceChannel?: Channel
  ): Promise<NotificationResult> => {
    const taxpayerId = taxpayer.taxpayer_id;
    
    // Set pending state
    nudgeStateMap.set(taxpayerId, { taxpayerId, status: 'pending' });
    notifyListeners();
    setIsSending(true);

    try {
      const result = await sendNotification(
        toTaxpayerData(taxpayer),
        customMessage,
        forceChannel
      );

      // Update state based on result
      nudgeStateMap.set(taxpayerId, {
        taxpayerId,
        status: result.status === 'sent' || result.status === 'delivered' ? 'sent' : 'failed',
        result,
      });
      notifyListeners();
      
      return result;
    } catch (error) {
      nudgeStateMap.set(taxpayerId, { taxpayerId, status: 'failed' });
      notifyListeners();
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [toTaxpayerData]);

  // Send nudges to multiple taxpayers
  const sendBatchNudges = useCallback(async (
    taxpayers: LocalTaxpayer[]
  ): Promise<NotificationResult[]> => {
    setIsSending(true);
    setBatchProgress({ completed: 0, total: taxpayers.length });

    // Set all to pending
    taxpayers.forEach(tp => {
      nudgeStateMap.set(tp.taxpayer_id, { taxpayerId: tp.taxpayer_id, status: 'pending' });
    });
    notifyListeners();

    try {
      const results = await sendBatchNotifications(
        taxpayers.map(toTaxpayerData),
        (completed, total, result) => {
          setBatchProgress({ completed, total });
          nudgeStateMap.set(result.taxpayerId, {
            taxpayerId: result.taxpayerId,
            status: result.status === 'sent' || result.status === 'delivered' ? 'sent' : 'failed',
            result,
          });
          notifyListeners();
        }
      );
      
      return results;
    } finally {
      setIsSending(false);
      setBatchProgress(null);
    }
  }, [toTaxpayerData]);

  // Send nudges to high-risk taxpayers only
  const sendHighRiskNudges = useCallback(async (
    taxpayers: LocalTaxpayer[]
  ): Promise<NotificationResult[]> => {
    const highRisk = taxpayers.filter(tp => tp.riskLevel === 'high');
    return sendBatchNudges(highRisk);
  }, [sendBatchNudges]);

  // Get nudge state for a taxpayer
  const getNudgeState = useCallback((taxpayerId: string): NudgeState | undefined => {
    return nudgeStateMap.get(taxpayerId);
  }, []);

  // Check if nudge was sent
  const isNudgeSent = useCallback((taxpayerId: string): boolean => {
    const state = nudgeStateMap.get(taxpayerId);
    return state?.status === 'sent';
  }, []);

  // Get all nudge states
  const getAllNudgeStates = useCallback((): NudgeState[] => {
    return Array.from(nudgeStateMap.values());
  }, []);

  // Clear nudge history
  const clearNudgeHistory = useCallback(() => {
    nudgeStateMap.clear();
    notifyListeners();
  }, []);

  // Get provider info
  const providerInfo = useMemo(() => getProviderInfo(), []);

  return {
    sendNudge,
    sendBatchNudges,
    sendHighRiskNudges,
    getNudgeState,
    isNudgeSent,
    getAllNudgeStates,
    clearNudgeHistory,
    isSending,
    batchProgress,
    providerInfo,
  };
}
