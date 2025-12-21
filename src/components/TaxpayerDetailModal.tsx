import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  MapPin,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Clock,
  CreditCard,
  FileText,
  TrendingUp,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { calculateBilling, type BillingResult } from '@/integrations/billing';
import { PaymentModal } from './PaymentModal';
import type { LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { TAX_TYPE_MAP, PROPERTY_TYPE_MAP, USAGE_CATEGORY_MAP, PAYMENT_MODE_MAP } from '@/hooks/useLocalTaxpayers';

interface TaxpayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxpayer: LocalTaxpayer | null;
  onSendNudge?: (taxpayer: LocalTaxpayer) => void;
}

const riskColors = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white',
};

export function TaxpayerDetailModal({ isOpen, onClose, taxpayer, onSendNudge }: TaxpayerDetailModalProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const billing = useMemo<BillingResult | null>(() => {
    if (!taxpayer) return null;
    return calculateBilling({
      taxpayerId: taxpayer.taxpayer_id,
      dueAmount: taxpayer.due_amount,
      arrearsAmount: taxpayer.arrears_amount,
      paidAmount: 0,
      dueDate: new Date(taxpayer.due_date),
      paymentDate: new Date(),
    });
  }, [taxpayer]);

  if (!taxpayer || !billing) return null;

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setIsPaymentModalOpen(false);
  };

  const statusColors = {
    'on-time': 'text-green-600 bg-green-100 dark:bg-green-900/30',
    'overdue': 'text-destructive bg-destructive/10',
    'partial': 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    'paid': 'text-primary bg-primary/10',
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Taxpayer Details
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span className="font-mono">{taxpayer.taxpayer_id}</span>
                  <Badge className={riskColors[taxpayer.riskLevel]}>
                    {taxpayer.riskLevel.charAt(0).toUpperCase() + taxpayer.riskLevel.slice(1)} Risk
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="billing" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="billing">Billing Details</TabsTrigger>
              <TabsTrigger value="info">Taxpayer Info</TabsTrigger>
            </TabsList>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4 mt-4">
              {/* Status Card */}
              <Card className={`${statusColors[billing.status]} border-none`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {billing.isOverdue ? (
                        <AlertTriangle className="h-8 w-8" />
                      ) : (
                        <CheckCircle2 className="h-8 w-8" />
                      )}
                      <div>
                        <p className="text-lg font-semibold capitalize">{billing.status}</p>
                        <p className="text-sm opacity-80">
                          {billing.isOverdue
                            ? `${billing.delayDays} days overdue`
                            : 'Payment on track'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Total Due</p>
                      <p className="text-2xl font-bold">₹{billing.totalDue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Breakdown */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax Type</span>
                    <Badge variant="outline">{TAX_TYPE_MAP[taxpayer.tax_type]}</Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Principal Amount
                      </span>
                      <span className="font-medium">₹{billing.breakdown.principal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Arrears
                      </span>
                      <span className={`font-medium ${billing.breakdown.arrears > 0 ? 'text-amber-600' : ''}`}>
                        ₹{billing.breakdown.arrears.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Penalty
                        {billing.delayDays > 0 && (
                          <span className="text-xs text-destructive">
                            ({billing.delayDays}d × 2%)
                          </span>
                        )}
                      </span>
                      <span className={`font-medium ${billing.breakdown.penalty > 0 ? 'text-destructive' : ''}`}>
                        ₹{billing.breakdown.penalty.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total Due
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ₹{billing.totalDue.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Due Date */}
              <Card className="bg-muted/50">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </span>
                    <span className={`font-medium ${billing.isOverdue ? 'text-destructive' : ''}`}>
                      {new Date(taxpayer.due_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Success Message */}
              {paymentSuccess && (
                <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Payment processed successfully!</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={() => setIsPaymentModalOpen(true)}
                  disabled={paymentSuccess}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {paymentSuccess ? 'Paid' : 'Make Payment'}
                </Button>
                {onSendNudge && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onSendNudge(taxpayer)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Nudge
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Taxpayer ID</p>
                      <p className="font-mono font-medium">{taxpayer.taxpayer_id}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk Score</p>
                      <p className="font-medium">{(taxpayer.default_risk_probability * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </span>
                      <span className="font-medium">Ward {taxpayer.ward}, Zone {taxpayer.zone}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Property Type</span>
                      <Badge variant="secondary">{PROPERTY_TYPE_MAP[taxpayer.property_type]}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Usage Category</span>
                      <Badge variant="secondary">{USAGE_CATEGORY_MAP[taxpayer.usage_category]}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Mode</span>
                      <Badge variant="outline">{PAYMENT_MODE_MAP[taxpayer.payment_mode]}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tax Type</span>
                      <Badge variant="outline">{TAX_TYPE_MAP[taxpayer.tax_type]}</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Risk Category</span>
                      <span className="font-medium">{taxpayer.risk_category}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Delay Days</span>
                      <span className={`font-medium ${taxpayer.delay_days > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {taxpayer.delay_days} days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        taxpayer={taxpayer}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
