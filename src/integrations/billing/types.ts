// Types for the billing engine

export type PaymentStatus = 'on-time' | 'overdue' | 'partial' | 'paid';

export interface BillingInput {
  taxpayerId: string;
  dueAmount: number;
  arrearsAmount: number;
  paidAmount: number;
  dueDate: Date;
  paymentDate?: Date;
}

export interface BillingResult {
  taxpayerId: string;
  dueAmount: number;
  arrearsAmount: number;
  paidAmount: number;
  delayDays: number;
  penaltyRate: number;
  penaltyAmount: number;
  totalDue: number;
  remainingBalance: number;
  status: PaymentStatus;
  isOverdue: boolean;
  breakdown: {
    principal: number;
    arrears: number;
    penalty: number;
    paid: number;
    balance: number;
  };
}

export interface PenaltyConfig {
  dailyRate: number; // Default 2% = 0.02
  maxPenaltyPercent: number; // Cap penalty at this percentage
  gracePeriodDays: number; // Days before penalty starts
}
