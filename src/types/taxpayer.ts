export type RiskLevel = 'low' | 'medium' | 'high';

export type TaxType = 'Property Tax' | 'Water Tax' | 'Drainage Tax' | 'Commercial Tax';

export type BehaviorSegment = 'Regular Payer' | 'Occasional Defaulter' | 'Chronic Defaulter' | 'First-time Defaulter';

export interface Taxpayer {
  id: string;
  name: string;
  phone: string;
  email: string;
  ward: string;
  zone: string;
  propertyAddress: string;
  taxType: TaxType;
  dueAmount: number;
  arrearsAmount: number;
  penaltyAmount: number;
  totalDue: number;
  delayDays: number;
  riskScore: number;
  riskLevel: RiskLevel;
  behaviorSegment: BehaviorSegment;
  lastPaymentDate: string | null;
  paymentHistory: PaymentRecord[];
  riskFactors: RiskFactor[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'partial' | 'missed';
  delayDays: number;
}

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalDueAmount: number;
  expectedRecovery: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  arrearsTrend: {
    month: string;
    amount: number;
  }[];
  nudgesSent: number;
  responseRate: number;
}

export interface NudgeMessage {
  type: 'sms' | 'whatsapp';
  riskLevel: RiskLevel;
  template: string;
  preview: string;
}
