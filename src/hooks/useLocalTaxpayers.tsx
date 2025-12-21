import { useMemo, useState } from 'react';
import taxpayerData from '@/data/taxpayer_demo_data.json';

export type RiskLevel = 'low' | 'medium' | 'high';

// Maps for displaying human-readable values
export const TAX_TYPE_MAP: Record<number, string> = {
  0: 'Property Tax',
  1: 'Water Tax',
  2: 'Sewage Tax',
};

export const PROPERTY_TYPE_MAP: Record<number, string> = {
  0: 'Residential',
  1: 'Commercial',
  2: 'Industrial',
};

export const USAGE_CATEGORY_MAP: Record<number, string> = {
  0: 'Owner Occupied',
  1: 'Rented',
  2: 'Vacant',
};

export const PAYMENT_MODE_MAP: Record<number, string> = {
  0: 'Cash',
  1: 'Cheque',
  2: 'Online',
  3: 'UPI',
};

export interface LocalTaxpayer {
  taxpayer_id: string;
  name?: string;
  phone?: string;
  ward: number;
  zone: number;
  property_type: number;
  usage_category: number;
  tax_type: number;
  due_amount: number;
  arrears_amount: number;
  penalty_amount: number;
  due_date: string;
  payment_date: string;
  delay_days: number;
  payment_mode: number;
  default_risk_label: number;
  default_risk_probability: number;
  risk_category: string;
  riskLevel: RiskLevel;
}

export interface LocalDashboardStats {
  totalTaxpayers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

// Risk classification based on probability thresholds:
// Low Risk: probability < 0.3
// Medium Risk: probability between 0.3 and 0.6
// High Risk: probability > 0.6
function calculateRiskLevel(probability: number): RiskLevel {
  if (probability > 0.6) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

export function useLocalTaxpayers() {
  const taxpayers = useMemo<LocalTaxpayer[]>(() => {
    return taxpayerData.map((tp) => ({
      ...tp,
      riskLevel: calculateRiskLevel(tp.default_risk_probability),
    }));
  }, []);

  return { data: taxpayers, isLoading: false, error: null };
}

export function useLocalDashboardStats() {
  const { data: taxpayers } = useLocalTaxpayers();

  const stats = useMemo<LocalDashboardStats>(() => {
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    taxpayers.forEach((tp) => {
      if (tp.riskLevel === 'high') highRiskCount++;
      else if (tp.riskLevel === 'medium') mediumRiskCount++;
      else lowRiskCount++;
    });

    return {
      totalTaxpayers: taxpayers.length,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    };
  }, [taxpayers]);

  return { data: stats, isLoading: false, error: null };
}

export interface NudgeRecord {
  id: string;
  taxpayerId: string;
  riskLevel: RiskLevel;
  nudgeType: 'sms' | 'whatsapp' | 'email';
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: string;
}

// Global state for nudges (in a real app this would be in context or a state manager)
let globalNudgeHistory: NudgeRecord[] = [];
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useNudgeState() {
  const [, forceUpdate] = useState({});

  useMemo(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const sendNudge = (
    taxpayerId: string,
    riskLevel: RiskLevel,
    message: string,
    nudgeType: 'sms' | 'whatsapp' | 'email' = 'sms'
  ) => {
    const newNudge: NudgeRecord = {
      id: `nudge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taxpayerId,
      riskLevel,
      nudgeType,
      message,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    globalNudgeHistory = [newNudge, ...globalNudgeHistory];
    notifyListeners();
  };

  const isNudgeSent = (taxpayerId: string) =>
    globalNudgeHistory.some((n) => n.taxpayerId === taxpayerId);

  const getNudgeHistory = () => globalNudgeHistory;

  return { sendNudge, isNudgeSent, getNudgeHistory };
}
