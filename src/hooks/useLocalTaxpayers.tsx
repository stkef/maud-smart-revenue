import { useMemo, useState } from 'react';
import taxpayerData from '@/data/taxpayer_demo_data.json';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface LocalTaxpayer {
  taxpayer_id: string;
  ward: string;
  zone: string;
  tax_type: string;
  due_amount: number;
  arrears_amount: number;
  penalty_amount: number;
  delay_days: number;
  default_risk_label: number;
  riskLevel: RiskLevel;
}

export interface LocalDashboardStats {
  totalTaxpayers: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

function calculateRiskLevel(taxpayer: Omit<LocalTaxpayer, 'riskLevel'>): RiskLevel {
  // High risk: default_risk_label = 1 OR delay_days > 90
  if (taxpayer.default_risk_label === 1 || taxpayer.delay_days > 90) {
    return 'high';
  }
  // Medium risk: delay_days between 30-90
  if (taxpayer.delay_days >= 30 && taxpayer.delay_days <= 90) {
    return 'medium';
  }
  // Low risk: delay_days < 30
  return 'low';
}

export function useLocalTaxpayers() {
  const taxpayers = useMemo<LocalTaxpayer[]>(() => {
    return taxpayerData.map((tp) => ({
      ...tp,
      riskLevel: calculateRiskLevel(tp),
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
