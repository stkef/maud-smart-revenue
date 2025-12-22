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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

// Map risk category to database enum
function mapRiskLevel(riskCategory: string): 'low' | 'medium' | 'high' {
  const lower = riskCategory.toLowerCase();
  if (lower.includes('high')) return 'high';
  if (lower.includes('medium')) return 'medium';
  return 'low';
}

// Map channel to nudge type
function mapNudgeType(channel: string): 'sms' | 'whatsapp' | 'email' {
  if (channel === 'whatsapp') return 'whatsapp';
  if (channel === 'email') return 'email';
  return 'sms';
}

export function useMessagingIntegration() {
  const [, forceUpdate] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const { user } = useAuth();

  // Subscribe to state changes
  useMemo(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Persist nudge to database
  const persistNudge = useCallback(async (
    taxpayerId: string,
    message: string,
    channel: Channel,
    riskCategory: string,
    status: 'sent' | 'failed'
  ) => {
    if (!user?.id) {
      console.warn('[NUDGE PERSIST] No user ID, skipping database persist');
      return;
    }

    try {
      const nudgeData = {
        taxpayer_id: taxpayerId,
        message,
        nudge_type: mapNudgeType(channel),
        risk_level: mapRiskLevel(riskCategory),
        status: status === 'sent' ? 'sent' as const : 'failed' as const,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        created_by: user.id,
      };

      const { error } = await supabase.from('nudges').insert(nudgeData);
      
      if (error) {
        console.error('[NUDGE PERSIST] Failed to save nudge:', error);
      } else {
        console.log('[NUDGE PERSIST] Nudge saved to database for', taxpayerId);
      }
    } catch (err) {
      console.error('[NUDGE PERSIST] Error saving nudge:', err);
    }
  }, [user?.id]);

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

      const wasSuccessful = result.status === 'sent' || result.status === 'delivered';
      
      // Update state based on result
      nudgeStateMap.set(taxpayerId, {
        taxpayerId,
        status: wasSuccessful ? 'sent' : 'failed',
        result,
      });
      notifyListeners();
      
      // Persist to database with the actual message sent
      const messageToSave = result.message || customMessage || 'Nudge sent';
      await persistNudge(
        taxpayerId,
        messageToSave,
        result.channel,
        taxpayer.risk_category,
        wasSuccessful ? 'sent' : 'failed'
      );
      
      return result;
    } catch (error) {
      nudgeStateMap.set(taxpayerId, { taxpayerId, status: 'failed' });
      notifyListeners();
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [toTaxpayerData, persistNudge]);

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
        async (completed, total, result) => {
          setBatchProgress({ completed, total });
          const wasSuccessful = result.status === 'sent' || result.status === 'delivered';
          nudgeStateMap.set(result.taxpayerId, {
            taxpayerId: result.taxpayerId,
            status: wasSuccessful ? 'sent' : 'failed',
            result,
          });
          notifyListeners();
          
          // Find the taxpayer to get risk category
          const taxpayer = taxpayers.find(tp => tp.taxpayer_id === result.taxpayerId);
          if (taxpayer) {
            await persistNudge(
              result.taxpayerId,
              `Batch nudge sent via ${result.channel}`,
              result.channel,
              taxpayer.risk_category,
              wasSuccessful ? 'sent' : 'failed'
            );
          }
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
