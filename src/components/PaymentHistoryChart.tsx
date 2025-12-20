import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PaymentRecord } from '@/types/taxpayer';

interface PaymentHistoryChartProps {
  history: PaymentRecord[];
}

const statusColors = {
  paid: 'hsl(142 71% 45%)',
  partial: 'hsl(38 92% 50%)',
  missed: 'hsl(0 84% 60%)',
};

export function PaymentHistoryChart({ history }: PaymentHistoryChartProps) {
  const data = history.map((record) => ({
    ...record,
    month: new Date(record.date).toLocaleDateString('en-US', { month: 'short' }),
    displayAmount: record.status === 'missed' ? 0 : record.amount,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(220 13% 91%)" 
            vertical={false}
          />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(220 9% 46%)', fontSize: 11 }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as PaymentRecord & { displayAmount: number };
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-lg">
                    <p className="font-medium text-foreground">
                      {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize font-medium">{data.status}</span>
                    </p>
                    {data.status !== 'missed' && (
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatCurrency(data.amount)}
                      </p>
                    )}
                    {data.delayDays > 0 && (
                      <p className="text-sm text-destructive">
                        Delayed: {data.delayDays} days
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="displayAmount" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={statusColors[entry.status]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
