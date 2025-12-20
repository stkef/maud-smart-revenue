import { Taxpayer, DashboardStats, RiskLevel, TaxType, BehaviorSegment } from '@/types/taxpayer';

const taxTypes: TaxType[] = ['Property Tax', 'Water Tax', 'Drainage Tax', 'Commercial Tax'];
const behaviorSegments: BehaviorSegment[] = ['Regular Payer', 'Occasional Defaulter', 'Chronic Defaulter', 'First-time Defaulter'];
const zones = ['North', 'South', 'East', 'West', 'Central'];
const wards = Array.from({ length: 20 }, (_, i) => `Ward ${i + 1}`);

const firstNames = ['Ramesh', 'Suresh', 'Lakshmi', 'Priya', 'Venkat', 'Srinivas', 'Padma', 'Krishna', 'Radha', 'Anil', 'Sunitha', 'Ravi', 'Kavitha', 'Mohan', 'Deepa'];
const lastNames = ['Reddy', 'Naidu', 'Rao', 'Kumar', 'Sharma', 'Prasad', 'Devi', 'Varma', 'Chowdary', 'Gupta'];

function generateRiskFactors(riskLevel: RiskLevel, delayDays: number, arrearsAmount: number) {
  const factors = [];
  
  if (delayDays > 90) {
    factors.push({
      factor: 'Payment Delay',
      impact: 'negative' as const,
      weight: 0.35,
      description: `Payment delayed by ${delayDays} days exceeds threshold`
    });
  }
  
  if (arrearsAmount > 50000) {
    factors.push({
      factor: 'High Arrears',
      impact: 'negative' as const,
      weight: 0.25,
      description: `Accumulated arrears of ₹${arrearsAmount.toLocaleString('en-IN')}`
    });
  }
  
  if (riskLevel === 'high') {
    factors.push({
      factor: 'Historical Default Pattern',
      impact: 'negative' as const,
      weight: 0.2,
      description: 'Multiple missed payments in past 12 months'
    });
  }
  
  if (riskLevel === 'low') {
    factors.push({
      factor: 'Consistent Payment History',
      impact: 'positive' as const,
      weight: 0.3,
      description: 'Regular on-time payments for past 24 months'
    });
  }
  
  factors.push({
    factor: 'Property Value Assessment',
    impact: riskLevel === 'high' ? 'negative' as const : 'positive' as const,
    weight: 0.15,
    description: 'Based on property location and market value'
  });
  
  return factors;
}

function generatePaymentHistory(riskLevel: RiskLevel): Taxpayer['paymentHistory'] {
  const history = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const random = Math.random();
    
    let status: 'paid' | 'partial' | 'missed';
    let delayDays = 0;
    
    if (riskLevel === 'low') {
      status = random > 0.1 ? 'paid' : 'partial';
      delayDays = random > 0.8 ? Math.floor(Math.random() * 10) : 0;
    } else if (riskLevel === 'medium') {
      status = random > 0.4 ? 'paid' : random > 0.2 ? 'partial' : 'missed';
      delayDays = Math.floor(Math.random() * 45);
    } else {
      status = random > 0.6 ? 'partial' : random > 0.3 ? 'missed' : 'paid';
      delayDays = Math.floor(Math.random() * 120);
    }
    
    history.push({
      id: `pay-${i}`,
      date: date.toISOString().split('T')[0],
      amount: status === 'paid' ? 5000 + Math.floor(Math.random() * 10000) : status === 'partial' ? 2000 + Math.floor(Math.random() * 3000) : 0,
      status,
      delayDays
    });
  }
  
  return history;
}

function generateTaxpayer(index: number): Taxpayer {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  
  const riskScore = Math.random();
  const riskLevel: RiskLevel = riskScore < 0.33 ? 'low' : riskScore < 0.66 ? 'medium' : 'high';
  
  const dueAmount = Math.floor(5000 + Math.random() * 45000);
  const arrearsAmount = riskLevel === 'high' ? Math.floor(20000 + Math.random() * 80000) : riskLevel === 'medium' ? Math.floor(5000 + Math.random() * 30000) : Math.floor(Math.random() * 10000);
  const penaltyAmount = Math.floor(arrearsAmount * 0.12);
  const delayDays = riskLevel === 'high' ? Math.floor(90 + Math.random() * 270) : riskLevel === 'medium' ? Math.floor(30 + Math.random() * 90) : Math.floor(Math.random() * 30);
  
  const behaviorSegment: BehaviorSegment = riskLevel === 'high' ? (Math.random() > 0.5 ? 'Chronic Defaulter' : 'First-time Defaulter') : riskLevel === 'medium' ? 'Occasional Defaulter' : 'Regular Payer';
  
  const zone = zones[Math.floor(Math.random() * zones.length)];
  const ward = wards[Math.floor(Math.random() * wards.length)];
  
  return {
    id: `TP${String(index + 1).padStart(6, '0')}`,
    name,
    phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    ward,
    zone,
    propertyAddress: `${Math.floor(1 + Math.random() * 200)}, ${['MG Road', 'Gandhi Nagar', 'Lakshmi Colony', 'Vijay Nagar', 'Nehru Street', 'Ambedkar Road'][Math.floor(Math.random() * 6)]}, ${zone} Zone`,
    taxType: taxTypes[Math.floor(Math.random() * taxTypes.length)],
    dueAmount,
    arrearsAmount,
    penaltyAmount,
    totalDue: dueAmount + arrearsAmount + penaltyAmount,
    delayDays,
    riskScore,
    riskLevel,
    behaviorSegment,
    lastPaymentDate: riskLevel === 'high' ? null : new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentHistory: generatePaymentHistory(riskLevel),
    riskFactors: generateRiskFactors(riskLevel, delayDays, arrearsAmount)
  };
}

export const mockTaxpayers: Taxpayer[] = Array.from({ length: 150 }, (_, i) => generateTaxpayer(i));

export const mockDashboardStats: DashboardStats = {
  totalProperties: mockTaxpayers.length,
  totalDueAmount: mockTaxpayers.reduce((sum, t) => sum + t.totalDue, 0),
  expectedRecovery: mockTaxpayers.reduce((sum, t) => sum + (t.riskLevel === 'low' ? t.totalDue * 0.95 : t.riskLevel === 'medium' ? t.totalDue * 0.7 : t.totalDue * 0.4), 0),
  riskDistribution: {
    low: mockTaxpayers.filter(t => t.riskLevel === 'low').length,
    medium: mockTaxpayers.filter(t => t.riskLevel === 'medium').length,
    high: mockTaxpayers.filter(t => t.riskLevel === 'high').length,
  },
  arrearsTrend: [
    { month: 'Jul', amount: 4500000 },
    { month: 'Aug', amount: 5200000 },
    { month: 'Sep', amount: 4800000 },
    { month: 'Oct', amount: 5800000 },
    { month: 'Nov', amount: 6200000 },
    { month: 'Dec', amount: 5900000 },
  ],
  nudgesSent: 1247,
  responseRate: 68.5,
};

export const nudgeTemplates = {
  high: {
    sms: "URGENT: Dear {name}, your property tax of ₹{amount} is overdue by {days} days. Avoid legal action - pay immediately at maud.ap.gov.in or visit your ward office. Ref: {id}",
    whatsapp: "🚨 *URGENT NOTICE*\n\nDear {name},\n\nYour property tax payment of *₹{amount}* is critically overdue by *{days} days*.\n\n⚠️ To avoid:\n• Legal proceedings\n• Property seizure\n• Additional penalties\n\nPay immediately:\n🔗 maud.ap.gov.in/pay\n\nRef: {id}\n\n_MA&UD Department, Govt. of AP_"
  },
  medium: {
    sms: "Reminder: Dear {name}, property tax of ₹{amount} pending for {days} days. Pay soon to avoid penalty. Visit maud.ap.gov.in. Ref: {id}",
    whatsapp: "📋 *Payment Reminder*\n\nDear {name},\n\nYour property tax payment of *₹{amount}* is pending for *{days} days*.\n\n💡 Pay now to:\n• Avoid additional penalties\n• Maintain good compliance record\n\nPay online:\n🔗 maud.ap.gov.in/pay\n\nRef: {id}\n\n_MA&UD Department, Govt. of AP_"
  },
  low: {
    sms: "Thank you {name} for being a responsible taxpayer! Your upcoming tax of ₹{amount} is due. Continue your excellent record - pay at maud.ap.gov.in. Ref: {id}",
    whatsapp: "🌟 *Valued Taxpayer Appreciation*\n\nDear {name},\n\nThank you for your consistent tax compliance!\n\nYour upcoming payment of *₹{amount}* is due soon.\n\n✨ Benefits of timely payment:\n• Early payment discounts\n• Priority service access\n\nPay online:\n🔗 maud.ap.gov.in/pay\n\nRef: {id}\n\n_MA&UD Department, Govt. of AP_"
  }
};
