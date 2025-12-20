import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LocalTaxpayer } from '@/hooks/useLocalTaxpayers';

interface WardRiskChartProps {
  taxpayers: LocalTaxpayer[];
}

export function WardRiskChart({ taxpayers }: WardRiskChartProps) {
  const wardData = useMemo(() => {
    const wardStats: Record<number, { total: number; high: number; medium: number; low: number }> = {};

    taxpayers.forEach((tp) => {
      if (!wardStats[tp.ward]) {
        wardStats[tp.ward] = { total: 0, high: 0, medium: 0, low: 0 };
      }
      wardStats[tp.ward].total++;
      wardStats[tp.ward][tp.riskLevel]++;
    });

    return Object.entries(wardStats)
      .map(([ward, stats]) => ({
        ward: `W${ward}`,
        wardNumber: parseInt(ward),
        highRisk: stats.high,
        mediumRisk: stats.medium,
        lowRisk: stats.low,
        total: stats.total,
        highRiskPercent: ((stats.high / stats.total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.highRisk - a.highRisk)
      .slice(0, 10); // Top 10 wards with highest high-risk taxpayers
  }, [taxpayers]);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ward-wise High Risk Concentration</CardTitle>
        <CardDescription>Top 10 wards with highest number of high-risk taxpayers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wardData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="ward" type="category" tick={{ fontSize: 12 }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    highRisk: 'High Risk',
                    mediumRisk: 'Medium Risk',
                    lowRisk: 'Low Risk',
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Bar dataKey="highRisk" stackId="a" fill="hsl(0, 84%, 60%)" name="High Risk" />
              <Bar dataKey="mediumRisk" stackId="a" fill="hsl(45, 93%, 47%)" name="Medium Risk" />
              <Bar dataKey="lowRisk" stackId="a" fill="hsl(142, 71%, 45%)" name="Low Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
