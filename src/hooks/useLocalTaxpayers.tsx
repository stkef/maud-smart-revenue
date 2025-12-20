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

function mapRiskCategory(riskCategory: string): RiskLevel {
  const category = riskCategory.toLowerCase();
  if (category === 'high') return 'high';
  if (category === 'medium') return 'medium';
  return 'low';
}

export function useLocalTaxpayers() {
  const taxpayers = useMemo<LocalTaxpayer[]>(() => {
    return taxpayerData.map((tp) => ({
      ...tp,
      riskLevel: mapRiskCategory(tp.risk_category),
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

export function useNudgeState() {
  const [sentNudges, setSentNudges] = useState<Set<string>>(new Set());

  const sendNudge = (taxpayerId: string) => {
    setSentNudges((prev) => new Set(prev).add(taxpayerId));
  };

  const isNudgeSent = (taxpayerId: string) => sentNudges.has(taxpayerId);

  return { sendNudge, isNudgeSent };
}
