import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { IndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';

interface ArrearsRecoveryChartProps {
  taxpayers: LocalTaxpayer[];
}

// Recovery probability estimates based on risk category
const RECOVERY_RATES = {
  low: 0.95,    // 95% expected recovery
  medium: 0.70, // 70% expected recovery
  high: 0.35,   // 35% expected recovery
};

export function ArrearsRecoveryChart({ taxpayers }: ArrearsRecoveryChartProps) {
  const recoveryData = useMemo(() => {
    const byRisk = { low: { arrears: 0, count: 0 }, medium: { arrears: 0, count: 0 }, high: { arrears: 0, count: 0 } };

    taxpayers.forEach((tp) => {
      // Normalize arrears (ML data may be standardized, use absolute value for display)
      const arrears = Math.abs(tp.arrears_amount) * 10000; // Scale for visualization
      byRisk[tp.riskLevel].arrears += arrears;
      byRisk[tp.riskLevel].count++;
    });

    return [
      {
        category: 'Low Risk',
        totalArrears: Math.round(byRisk.low.arrears),
        estimatedRecovery: Math.round(byRisk.low.arrears * RECOVERY_RATES.low),
        count: byRisk.low.count,
      },
      {
        category: 'Medium Risk',
        totalArrears: Math.round(byRisk.medium.arrears),
        estimatedRecovery: Math.round(byRisk.medium.arrears * RECOVERY_RATES.medium),
        count: byRisk.medium.count,
      },
      {
        category: 'High Risk',
        totalArrears: Math.round(byRisk.high.arrears),
        estimatedRecovery: Math.round(byRisk.high.arrears * RECOVERY_RATES.high),
        count: byRisk.high.count,
      },
    ];
  }, [taxpayers]);

  const totals = useMemo(() => {
    const totalArrears = recoveryData.reduce((sum, d) => sum + d.totalArrears, 0);
    const totalRecovery = recoveryData.reduce((sum, d) => sum + d.estimatedRecovery, 0);
    const atRiskAmount = totalArrears - totalRecovery;
    return { totalArrears, totalRecovery, atRiskAmount };
  }, [recoveryData]);

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Arrears & Estimated Recovery</CardTitle>
        <CardDescription>Total arrears and predicted recoverable amounts by risk category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Arrears</p>
              <p className="text-xl font-bold">{formatCurrency(totals.totalArrears)}</p>
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Est. Recoverable</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalRecovery)}</p>
            </div>
          </div>
          <div className="p-4 bg-destructive/5 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">At Risk Amount</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totals.atRiskAmount)}</p>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recoveryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [formatCurrency(value), name === 'totalArrears' ? 'Total Arrears' : 'Est. Recovery']}
              />
              <Legend />
              <Bar dataKey="totalArrears" name="Total Arrears" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estimatedRecovery" name="Est. Recovery" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
