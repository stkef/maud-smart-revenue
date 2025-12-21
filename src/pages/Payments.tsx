import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentModal } from '@/components/PaymentModal';
import { BillingCard } from '@/components/BillingCard';
import { useLocalTaxpayers, TAX_TYPE_MAP, type LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { calculateBilling, calculateBillingStats, type BillingResult } from '@/integrations/billing';
import { getAllPayments, type PaymentRecord } from '@/integrations/payment';
import {
  Search,
  IndianRupee,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
  Filter,
} from 'lucide-react';

export default function Payments() {
  const { data: taxpayers } = useLocalTaxpayers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<LocalTaxpayer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(getAllPayments());

  // Calculate billing for all taxpayers
  const billingResults = useMemo(() => {
    const results = new Map<string, BillingResult>();
    taxpayers.forEach((tp) => {
      results.set(
        tp.taxpayer_id,
        calculateBilling({
          taxpayerId: tp.taxpayer_id,
          dueAmount: tp.due_amount,
          arrearsAmount: tp.arrears_amount,
          paidAmount: 0,
          dueDate: new Date(tp.due_date),
          paymentDate: new Date(),
        })
      );
    });
    return results;
  }, [taxpayers]);

  // Calculate stats
  const stats = useMemo(() => calculateBillingStats(billingResults), [billingResults]);

  // Filter taxpayers
  const filteredTaxpayers = useMemo(() => {
    return taxpayers.filter((tp) => {
      const billing = billingResults.get(tp.taxpayer_id);
      const matchesSearch = tp.taxpayer_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || billing?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [taxpayers, searchQuery, statusFilter, billingResults]);

  const handlePaymentSuccess = () => {
    setPaymentHistory(getAllPayments());
  };

  const openPaymentModal = (taxpayer: LocalTaxpayer) => {
    setSelectedTaxpayer(taxpayer);
    setIsPaymentModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Partial</Badge>;
      default:
        return <Badge variant="outline">On-time</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Payment Center</h2>
          <p className="text-muted-foreground">
            Process payments, view billing breakdowns, and track transactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Due</p>
                  <p className="text-2xl font-bold">₹{stats.totalDue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Penalties</p>
                  <p className="text-2xl font-bold text-destructive">₹{stats.totalPenalties.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Accounts</p>
                  <p className="text-2xl font-bold">{stats.overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold">{stats.collectionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Taxpayer Payment List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Taxpayer Accounts
              </CardTitle>
              <div className="flex gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by taxpayer ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="on-time">On-time</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taxpayer ID</TableHead>
                      <TableHead>Tax Type</TableHead>
                      <TableHead className="text-right">Total Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaxpayers.slice(0, 10).map((tp) => {
                      const billing = billingResults.get(tp.taxpayer_id);
                      return (
                        <TableRow 
                          key={tp.taxpayer_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedTaxpayer(tp)}
                        >
                          <TableCell className="font-medium">{tp.taxpayer_id}</TableCell>
                          <TableCell>{TAX_TYPE_MAP[tp.tax_type]}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{billing?.totalDue.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell>{getStatusBadge(billing?.status || 'on-time')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentModal(tp);
                              }}
                            >
                              Pay Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredTaxpayers.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing 10 of {filteredTaxpayers.length} taxpayers
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selected Taxpayer Billing / Recent Payments */}
          <div className="space-y-6">
            {selectedTaxpayer ? (
              <>
                <BillingCard taxpayer={selectedTaxpayer} />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => openPaymentModal(selectedTaxpayer)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a taxpayer to view billing details</p>
                </CardContent>
              </Card>
            )}

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payments recorded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.slice(0, 5).map((payment) => (
                      <div
                        key={payment.transactionId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">{payment.taxpayerId}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.timestamp).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium text-green-600">
                          +₹{payment.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        taxpayer={selectedTaxpayer}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
