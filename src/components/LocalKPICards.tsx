import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { LocalDashboardStats } from '@/hooks/useLocalTaxpayers';

interface LocalKPICardsProps {
  stats: LocalDashboardStats;
}

export function LocalKPICards({ stats }: LocalKPICardsProps) {
  const cards = [
    {
      title: 'Total Taxpayers',
      value: stats.totalTaxpayers,
      icon: Users,
      color: 'bg-primary/10 text-primary',
      borderColor: 'border-l-primary',
    },
    {
      title: 'High Risk',
      value: stats.highRiskCount,
      icon: AlertTriangle,
      color: 'bg-destructive/10 text-destructive',
      borderColor: 'border-l-destructive',
    },
    {
      title: 'Medium Risk',
      value: stats.mediumRiskCount,
      icon: AlertCircle,
      color: 'bg-yellow-500/10 text-yellow-600',
      borderColor: 'border-l-yellow-500',
    },
    {
      title: 'Low Risk',
      value: stats.lowRiskCount,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-600',
      borderColor: 'border-l-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`border-l-4 ${card.borderColor} shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.color}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
