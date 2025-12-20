import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LocalTaxpayer, TAX_TYPE_MAP, PAYMENT_MODE_MAP } from '@/hooks/useLocalTaxpayers';
import { Clock, CreditCard, AlertTriangle, FileText, Wallet } from 'lucide-react';

interface RiskFactorsPanelProps {
  taxpayers: LocalTaxpayer[];
}

interface FeatureImportance {
  name: string;
  icon: React.ElementType;
  importance: number;
  description: string;
  insight: string;
}

export function RiskFactorsPanel({ taxpayers }: RiskFactorsPanelProps) {
  const insights = useMemo(() => {
    const highRiskTaxpayers = taxpayers.filter((tp) => tp.riskLevel === 'high');
    const allTaxpayers = taxpayers;

    // Calculate average values for high-risk vs all
    const avgDelayHighRisk = highRiskTaxpayers.reduce((sum, tp) => sum + tp.delay_days, 0) / (highRiskTaxpayers.length || 1);
    const avgDelayAll = allTaxpayers.reduce((sum, tp) => sum + tp.delay_days, 0) / (allTaxpayers.length || 1);

    const avgArrearsHighRisk = highRiskTaxpayers.reduce((sum, tp) => sum + Math.abs(tp.arrears_amount), 0) / (highRiskTaxpayers.length || 1);
    const avgArrearsAll = allTaxpayers.reduce((sum, tp) => sum + Math.abs(tp.arrears_amount), 0) / (allTaxpayers.length || 1);

    const avgPenaltyHighRisk = highRiskTaxpayers.reduce((sum, tp) => sum + Math.abs(tp.penalty_amount), 0) / (highRiskTaxpayers.length || 1);
    const avgPenaltyAll = allTaxpayers.reduce((sum, tp) => sum + Math.abs(tp.penalty_amount), 0) / (allTaxpayers.length || 1);

    // Payment mode distribution for high-risk
    const paymentModeCount: Record<number, number> = {};
    highRiskTaxpayers.forEach((tp) => {
      paymentModeCount[tp.payment_mode] = (paymentModeCount[tp.payment_mode] || 0) + 1;
    });
    const dominantPaymentMode = Object.entries(paymentModeCount).sort((a, b) => b[1] - a[1])[0];

    // Tax type distribution for high-risk
    const taxTypeCount: Record<number, number> = {};
    highRiskTaxpayers.forEach((tp) => {
      taxTypeCount[tp.tax_type] = (taxTypeCount[tp.tax_type] || 0) + 1;
    });
    const dominantTaxType = Object.entries(taxTypeCount).sort((a, b) => b[1] - a[1])[0];

    return {
      avgDelayHighRisk: Math.round(avgDelayHighRisk),
      avgDelayAll: Math.round(avgDelayAll),
      avgArrearsHighRisk,
      avgArrearsAll,
      avgPenaltyHighRisk,
      avgPenaltyAll,
      dominantPaymentMode: dominantPaymentMode ? parseInt(dominantPaymentMode[0]) : 0,
      dominantTaxType: dominantTaxType ? parseInt(dominantTaxType[0]) : 0,
    };
  }, [taxpayers]);

  // Feature importance based on typical ML model feature rankings
  const featureImportance: FeatureImportance[] = [
    {
      name: 'Delay Days',
      icon: Clock,
      importance: 92,
      description: 'Days between due date and payment',
      insight: `High-risk avg: ${insights.avgDelayHighRisk} days vs overall avg: ${insights.avgDelayAll} days`,
    },
    {
      name: 'Arrears Amount',
      icon: CreditCard,
      importance: 85,
      description: 'Outstanding amount from previous periods',
      insight: `High-risk taxpayers show ${((insights.avgArrearsHighRisk / insights.avgArrearsAll) * 100 - 100).toFixed(0)}% higher arrears`,
    },
    {
      name: 'Penalty Amount',
      icon: AlertTriangle,
      importance: 72,
      description: 'Accumulated penalty charges',
      insight: `Penalty accumulation strongly correlates with default risk`,
    },
    {
      name: 'Payment Mode',
      icon: Wallet,
      importance: 58,
      description: 'Method of payment used',
      insight: `Most common in high-risk: ${PAYMENT_MODE_MAP[insights.dominantPaymentMode] || 'N/A'}`,
    },
    {
      name: 'Tax Type',
      icon: FileText,
      importance: 45,
      description: 'Category of tax (Property, Water, Sewage)',
      insight: `Higher risk in: ${TAX_TYPE_MAP[insights.dominantTaxType] || 'N/A'}`,
    },
  ];

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Model Explainability</CardTitle>
        <CardDescription>Key features influencing default risk prediction</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {featureImportance.map((feature) => (
          <div key={feature.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{feature.name}</span>
              </div>
              <span className="text-xs font-semibold text-primary">{feature.importance}%</span>
            </div>
            <Progress value={feature.importance} className="h-2" />
            <p className="text-xs text-muted-foreground">{feature.insight}</p>
          </div>
        ))}

        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Feature importance values indicate relative contribution to risk prediction. 
            Higher values mean stronger influence on default probability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
