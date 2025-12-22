import { useState, useMemo } from 'react';
import { useLocalTaxpayers, useLocalDashboardStats, type LocalTaxpayer } from '@/hooks/useLocalTaxpayers';
import { useMessagingIntegration } from '@/hooks/useMessagingIntegration';
import { LocalKPICards } from '@/components/LocalKPICards';
import { LocalRiskChart } from '@/components/LocalRiskChart';
import { LocalTaxpayerTable } from '@/components/LocalTaxpayerTable';
import { WardRiskChart } from '@/components/WardRiskChart';
import { ArrearsRecoveryChart } from '@/components/ArrearsRecoveryChart';
import { RiskFactorsPanel } from '@/components/RiskFactorsPanel';
import { HighRiskTable } from '@/components/HighRiskTable';
import { NudgeHistoryTable } from '@/components/NudgeHistoryTable';
import { AdminPanel } from '@/components/AdminPanel';
import { TaxpayerDetailModal } from '@/components/TaxpayerDetailModal';
import { AutomationDashboard } from '@/components/AutomationDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { LayoutDashboard, LogOut, BarChart3, Users, AlertTriangle, Brain, MessageSquare, ShieldCheck, Settings, ExternalLink, CreditCard, IndianRupee, Clock, TrendingUp, Search, Filter, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { calculateBilling, calculateBillingStats, type BillingResult } from '@/integrations/billing';
import { TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';

export default function LocalDashboard() {
  const { data: taxpayers } = useLocalTaxpayers();
  const { data: stats } = useLocalDashboardStats();
  const { getAllNudgeStates, providerInfo } = useMessagingIntegration();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const nudgeCount = getAllNudgeStates().length;

  // Payment tab state
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [selectedPaymentTaxpayer, setSelectedPaymentTaxpayer] = useState<LocalTaxpayer | null>(null);

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

  const billingStats = useMemo(() => calculateBillingStats(billingResults), [billingResults]);

  // Filter taxpayers for payment tab
  const filteredPaymentTaxpayers = useMemo(() => {
    return taxpayers.filter((tp) => {
      const billing = billingResults.get(tp.taxpayer_id);
      const matchesSearch = tp.taxpayer_id.toLowerCase().includes(paymentSearch.toLowerCase());
      const matchesStatus = paymentStatusFilter === 'all' || billing?.status === paymentStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [taxpayers, paymentSearch, paymentStatusFilter, billingResults]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Partial</Badge>;
      default:
        return <Badge variant="outline">On-time</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Predictive Revenue Dashboard</h1>
                <p className="text-sm text-muted-foreground">AI-Driven Tax Compliance & Risk Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Citizen Portal Link */}
              <Link to="/risk-lookup">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Citizen Portal
                </Button>
              </Link>
              {/* Provider Badge */}
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 font-mono text-xs">
                <Settings className="h-3 w-3" />
                {providerInfo.provider.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <LocalKPICards stats={stats} />

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-8' : 'grid-cols-7'} lg:w-auto lg:inline-grid`}>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Bot className="h-4 w-4 hidden sm:inline" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="high-risk" className="gap-2">
              <AlertTriangle className="h-4 w-4 hidden sm:inline" />
              High Risk
            </TabsTrigger>
            <TabsTrigger value="all-taxpayers" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              All Taxpayers
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4 hidden sm:inline" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="nudge-history" className="gap-2">
              <MessageSquare className="h-4 w-4 hidden sm:inline" />
              Nudges {nudgeCount > 0 && `(${nudgeCount})`}
            </TabsTrigger>
            <TabsTrigger value="explainability" className="gap-2">
              <Brain className="h-4 w-4 hidden sm:inline" />
              Insights
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-2">
                <ShieldCheck className="h-4 w-4 hidden sm:inline" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LocalRiskChart stats={stats} />
              <WardRiskChart taxpayers={taxpayers} />
            </div>

            <ArrearsRecoveryChart taxpayers={taxpayers} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">High Risk Rate</p>
                    <p className="text-2xl font-bold text-destructive">
                      {stats.totalTaxpayers > 0
                        ? ((stats.highRiskCount / stats.totalTaxpayers) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Compliance Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalTaxpayers > 0
                        ? ((stats.lowRiskCount / stats.totalTaxpayers) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Medium Risk Rate</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.totalTaxpayers > 0
                        ? ((stats.mediumRiskCount / stats.totalTaxpayers) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Taxpayers</p>
                    <p className="text-2xl font-bold">{stats.totalTaxpayers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Integration Layer Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Messaging Provider</p>
                      <Badge variant="outline" className="font-mono">
                        {providerInfo.provider.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {providerInfo.provider === 'mock' 
                        ? 'Mock gateway active - messages are simulated'
                        : 'Twilio gateway active - real SMS delivery enabled'}
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-l-destructive bg-destructive/5 rounded-r-lg">
                    <p className="text-sm font-medium text-destructive">High Risk → WhatsApp (urgent)</p>
                    <p className="text-xs text-muted-foreground">Fallback to SMS if WhatsApp unavailable</p>
                  </div>
                  <div className="p-3 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 rounded-r-lg">
                    <p className="text-sm font-medium text-yellow-600">Medium Risk → SMS (normal)</p>
                    <p className="text-xs text-muted-foreground">Standard deadline reminders</p>
                  </div>
                  <div className="p-3 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
                    <p className="text-sm font-medium text-green-600">Low Risk → SMS (low priority)</p>
                    <p className="text-xs text-muted-foreground">Informational nudges</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <AutomationDashboard />
          </TabsContent>

          {/* High Risk Tab */}
          <TabsContent value="high-risk" className="space-y-6">
            <HighRiskTable taxpayers={taxpayers} />
          </TabsContent>

          {/* All Taxpayers Tab */}
          <TabsContent value="all-taxpayers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Taxpayer Registry</CardTitle>
              </CardHeader>
              <CardContent>
                <LocalTaxpayerTable taxpayers={taxpayers} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Payment Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <IndianRupee className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="text-2xl font-bold">₹{billingStats.totalDue.toLocaleString()}</p>
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
                      <p className="text-2xl font-bold text-destructive">₹{billingStats.totalPenalties.toLocaleString()}</p>
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
                      <p className="text-2xl font-bold">{billingStats.overdueCount}</p>
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
                      <p className="text-2xl font-bold">{billingStats.collectionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Taxpayer Payment Status
                </CardTitle>
                <div className="flex gap-3 pt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by taxpayer ID..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
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
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Penalty</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentTaxpayers.slice(0, 15).map((tp) => {
                        const billing = billingResults.get(tp.taxpayer_id);
                        return (
                          <TableRow key={tp.taxpayer_id}>
                            <TableCell>
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium text-primary"
                                onClick={() => setSelectedPaymentTaxpayer(tp)}
                              >
                                {tp.taxpayer_id}
                              </Button>
                            </TableCell>
                            <TableCell>{TAX_TYPE_MAP[tp.tax_type]}</TableCell>
                            <TableCell className="text-right">₹{billing?.breakdown.principal.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-destructive">
                              {billing?.breakdown.penalty ? `₹${billing.breakdown.penalty.toLocaleString()}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{billing?.totalDue.toLocaleString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(billing?.status || 'on-time')}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => setSelectedPaymentTaxpayer(tp)}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {filteredPaymentTaxpayers.length > 15 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Showing 15 of {filteredPaymentTaxpayers.length} taxpayers
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nudge History Tab */}
          <TabsContent value="nudge-history" className="space-y-6">
            <NudgeHistoryTable />
          </TabsContent>

          {/* Explainability Tab */}
          <TabsContent value="explainability" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RiskFactorsPanel taxpayers={taxpayers} />
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Model Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Model Type</p>
                      <p className="text-lg font-semibold">Binary Classification</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Target Variable</p>
                      <p className="text-lg font-semibold">default_risk_label</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk Thresholds</p>
                      <p className="text-sm font-medium">Low: &lt;0.3 | Med: 0.3-0.6 | High: &gt;0.6</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Records</p>
                      <p className="text-lg font-semibold">{stats.totalTaxpayers}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">Usage Context</p>
                    <p className="text-xs text-muted-foreground">
                      This system is designed strictly as a <strong>decision-support tool</strong>, not an automated enforcement mechanism. 
                      All communication is advisory and aimed at improving voluntary compliance. 
                      Data is anonymized and compliant with data protection principles.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Input Features</p>
                    <div className="flex flex-wrap gap-2">
                      {['due_amount', 'arrears_amount', 'penalty_amount', 'delay_days', 'tax_type', 'property_type', 'usage_category', 'ward', 'zone', 'payment_mode'].map((feature) => (
                        <span key={feature} className="px-2 py-1 bg-card border rounded text-xs font-mono">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Taxpayer Detail Modal for Payments */}
      <TaxpayerDetailModal
        isOpen={!!selectedPaymentTaxpayer}
        onClose={() => setSelectedPaymentTaxpayer(null)}
        taxpayer={selectedPaymentTaxpayer}
      />
    </div>
  );
}
