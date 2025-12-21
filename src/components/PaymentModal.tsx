import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Wallet,
  Banknote,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Receipt,
  IndianRupee,
  Loader2,
} from 'lucide-react';
import { calculateBilling, type BillingResult } from '@/integrations/billing';
import { processPayment, type PaymentMethod, type PaymentResponse } from '@/integrations/payment';
import type { LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxpayer: LocalTaxpayer | null;
  onSuccess?: (response: PaymentResponse) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'upi', label: 'UPI', icon: Wallet },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'netbanking', label: 'Net Banking', icon: Building2 },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'cheque', label: 'Cheque', icon: FileText },
];

export function PaymentModal({ isOpen, onClose, taxpayer, onSuccess }: PaymentModalProps) {
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

  // Calculate billing when taxpayer changes
  useEffect(() => {
    if (taxpayer) {
      const result = calculateBilling({
        taxpayerId: taxpayer.taxpayer_id,
        dueAmount: taxpayer.due_amount,
        arrearsAmount: taxpayer.arrears_amount,
        paidAmount: 0, // Assuming fresh payment
        dueDate: new Date(taxpayer.due_date),
        paymentDate: new Date(),
      });
      setBilling(result);
      setPaymentAmount(result.totalDue.toFixed(2));
      setPaymentResult(null);
    }
  }, [taxpayer]);

  const handlePayment = async () => {
    if (!taxpayer || !billing) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await processPayment({
        taxpayerId: taxpayer.taxpayer_id,
        amount,
        method: paymentMethod,
        reference: `TAX-${taxpayer.taxpayer_id}-${Date.now()}`,
      });

      setPaymentResult(response);

      if (response.success) {
        toast({
          title: 'Payment Successful',
          description: `Transaction ID: ${response.transactionId}`,
        });
        onSuccess?.(response);
      } else {
        toast({
          title: 'Payment Failed',
          description: response.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPaymentResult(null);
      onClose();
    }
  };

  if (!taxpayer || !billing) return null;

  const MethodIcon = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.icon || Wallet;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Make Payment
          </DialogTitle>
          <DialogDescription>
            Pay tax dues for {taxpayer.taxpayer_id}
          </DialogDescription>
        </DialogHeader>

        {/* Billing Breakdown */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tax Type</span>
              <Badge variant="outline">{TAX_TYPE_MAP[taxpayer.tax_type]}</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal Amount</span>
                <span>₹{billing.breakdown.principal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Arrears</span>
                <span className={billing.breakdown.arrears > 0 ? 'text-amber-600' : ''}>
                  ₹{billing.breakdown.arrears.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Penalty
                  {billing.delayDays > 0 && (
                    <span className="text-xs text-destructive">
                      ({billing.delayDays} days × 2%)
                    </span>
                  )}
                </span>
                <span className={billing.breakdown.penalty > 0 ? 'text-destructive' : ''}>
                  ₹{billing.breakdown.penalty.toLocaleString()}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Total Due</span>
              <span className="text-lg text-primary">₹{billing.totalDue.toLocaleString()}</span>
            </div>

            {/* Status Badge */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={billing.status === 'overdue' ? 'destructive' : billing.status === 'paid' ? 'default' : 'secondary'}
              >
                {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Result */}
        {paymentResult && (
          <Card className={paymentResult.success ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-destructive bg-destructive/10'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {paymentResult.success ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
                  </p>
                  {paymentResult.success ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        Receipt: {paymentResult.receiptNumber}
                      </p>
                      <p>Transaction: {paymentResult.transactionId}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">{paymentResult.error}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {!paymentResult?.success && (
          <div className="space-y-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-9"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(billing.totalDue.toFixed(2))}
                >
                  Full Amount
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount((billing.totalDue / 2).toFixed(2))}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(billing.breakdown.principal.toFixed(2))}
                >
                  Principal Only
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="flex-1">
            {paymentResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {!paymentResult?.success && (
            <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MethodIcon className="h-4 w-4 mr-2" />
                  Pay ₹{parseFloat(paymentAmount || '0').toLocaleString()}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
