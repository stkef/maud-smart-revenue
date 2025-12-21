import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  IndianRupee,
  Calendar,
  AlertTriangle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { calculateBilling, type BillingResult } from '@/integrations/billing';
import type { LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';

interface BillingCardProps {
  taxpayer: LocalTaxpayer;
  className?: string;
}

export function BillingCard({ taxpayer, className }: BillingCardProps) {
  const billing = useMemo<BillingResult>(() => {
    return calculateBilling({
      taxpayerId: taxpayer.taxpayer_id,
      dueAmount: taxpayer.due_amount,
      arrearsAmount: taxpayer.arrears_amount,
      paidAmount: 0,
      dueDate: new Date(taxpayer.due_date),
      paymentDate: new Date(),
    });
  }, [taxpayer]);

  const penaltyPercentage = billing.dueAmount > 0 
    ? (billing.penaltyAmount / billing.dueAmount) * 100 
    : 0;

  const statusColors = {
    'on-time': 'bg-green-500',
    'overdue': 'bg-destructive',
    'partial': 'bg-amber-500',
    'paid': 'bg-primary',
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-primary" />
            Billing Details
          </CardTitle>
          <Badge 
            variant={billing.isOverdue ? 'destructive' : 'default'}
            className="capitalize"
          >
            {billing.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tax Type */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax Type</span>
          <Badge variant="outline">{TAX_TYPE_MAP[taxpayer.tax_type]}</Badge>
        </div>

        <Separator />

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Principal</span>
            <span className="font-medium">₹{billing.breakdown.principal.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Arrears
            </span>
            <span className={`font-medium ${billing.breakdown.arrears > 0 ? 'text-amber-600' : ''}`}>
              ₹{billing.breakdown.arrears.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Penalty
              </span>
              <span className={`font-medium ${billing.breakdown.penalty > 0 ? 'text-destructive' : ''}`}>
                ₹{billing.breakdown.penalty.toLocaleString()}
              </span>
            </div>
            {billing.delayDays > 0 && (
              <div className="text-xs text-muted-foreground pl-4">
                {billing.delayDays} days overdue × 2% daily rate
              </div>
            )}
            {penaltyPercentage > 0 && (
              <Progress value={Math.min(penaltyPercentage, 100)} className="h-1" />
            )}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Total Due
          </span>
          <span className="text-xl font-bold text-primary">
            ₹{billing.totalDue.toLocaleString()}
          </span>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due Date
          </span>
          <span className={billing.isOverdue ? 'text-destructive font-medium' : ''}>
            {new Date(taxpayer.due_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`h-2 w-2 rounded-full ${statusColors[billing.status]}`} />
          <span className="text-muted-foreground">
            {billing.status === 'overdue' && `${billing.delayDays} days overdue`}
            {billing.status === 'on-time' && 'Payment due soon'}
            {billing.status === 'partial' && 'Partial payment received'}
            {billing.status === 'paid' && 'Fully paid'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
