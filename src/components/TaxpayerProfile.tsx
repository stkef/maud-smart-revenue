import { Taxpayer } from '@/types/taxpayer';
import { RiskBadge } from './RiskBadge';
import { RiskScoreGauge } from './RiskScoreGauge';
import { PaymentHistoryChart } from './PaymentHistoryChart';
import { RiskFactorsList } from './RiskFactorsList';
import { NudgePreview } from './NudgePreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building,
  User,
  TrendingUp,
  History,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxpayerProfileProps {
  taxpayer: Taxpayer;
  onClose: () => void;
}

export function TaxpayerProfile({ taxpayer, onClose }: TaxpayerProfileProps) {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-card shadow-xl animate-slide-up border-l">
        {/* Header */}
        <div className="sticky top-0 z-10 gradient-primary p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary-foreground">
                    {taxpayer.name}
                  </h2>
                  <p className="text-sm text-primary-foreground/80 font-mono">
                    {taxpayer.id}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Info */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{taxpayer.ward}, {taxpayer.zone} Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{taxpayer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="truncate">{taxpayer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>{taxpayer.taxType}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Score & Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-2">
                <RiskScoreGauge
                  score={taxpayer.riskScore}
                  level={taxpayer.riskLevel}
                  size="md"
                />
                <RiskBadge level={taxpayer.riskLevel} size="lg" className="mt-4" />
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {taxpayer.behaviorSegment}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Due</span>
                  <span className="font-semibold">{formatCurrency(taxpayer.dueAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Arrears</span>
                  <span className="font-semibold text-warning">{formatCurrency(taxpayer.arrearsAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Penalty</span>
                  <span className="font-semibold text-destructive">{formatCurrency(taxpayer.penaltyAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Due</span>
                  <span className="text-lg font-bold">{formatCurrency(taxpayer.totalDue)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {taxpayer.lastPaymentDate
                      ? `Last payment: ${new Date(taxpayer.lastPaymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'No payment record'}
                  </span>
                </div>
                {taxpayer.delayDays > 0 && (
                  <div className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    taxpayer.delayDays > 90 ? 'text-destructive' : 'text-warning'
                  )}>
                    <TrendingUp className="h-4 w-4" />
                    <span>Payment delayed by {taxpayer.delayDays} days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                AI Risk Analysis Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskFactorsList factors={taxpayer.riskFactors} />
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5" />
                Payment History (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentHistoryChart history={taxpayer.paymentHistory} />
              <div className="mt-4 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-muted-foreground">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Partial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Missed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nudge Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Personalized Reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NudgePreview taxpayer={taxpayer} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
