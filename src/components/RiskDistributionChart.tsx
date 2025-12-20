import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DashboardStats } from '@/types/taxpayer';

interface RiskDistributionChartProps {
  data: DashboardStats['riskDistribution'];
}

const COLORS = {
  low: 'hsl(142 71% 45%)',
  medium: 'hsl(38 92% 50%)',
  high: 'hsl(0 84% 60%)',
};

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const chartData = [
    { name: 'Low Risk', value: data.low, color: COLORS.low },
    { name: 'Medium Risk', value: data.medium, color: COLORS.medium },
    { name: 'High Risk', value: data.high, color: COLORS.high },
  ];

  const total = data.low + data.medium + data.high;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-lg">
                    <p className="font-medium text-foreground">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.value} properties ({percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
