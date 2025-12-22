// Automation Dashboard Component

import { useState, useMemo } from 'react';
import { useLocalTaxpayers, TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';
import { useAutomation } from '@/hooks/useAutomation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Pause,
  RefreshCw,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  IndianRupee,
  Send,
  XCircle,
  Activity,
  Bot,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

const riskColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const eventTypeConfig = {
  risk_escalation: { icon: TrendingUp, color: 'text-amber-500', label: 'Risk Escalation' },
  nudge_sent: { icon: Send, color: 'text-blue-500', label: 'Nudge Sent' },
  payment_received: { icon: CheckCircle, color: 'text-green-500', label: 'Payment Received' },
  nudge_blocked: { icon: XCircle, color: 'text-gray-500', label: 'Nudge Blocked' },
  follow_up: { icon: RefreshCw, color: 'text-purple-500', label: 'Follow-up' },
};

export function AutomationDashboard() {
  const { data: taxpayers } = useLocalTaxpayers();
  const {
    schedulerState,
    activityLogs,
    logStats,
    isProcessing,
    progress,
    runAutomation,
    simulatePaymentForTaxpayer,
    resetTaxpayerPayment,
    sendManualNudge,
    getTaxpayerDelay,
    getTaxpayerRisk,
    isTaxpayerPaid,
    getStats,
  } = useAutomation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Calculate stats
  const stats = useMemo(() => getStats(taxpayers), [taxpayers, getStats]);
  
  // Get overdue taxpayers
  const overdueTaxpayers = useMemo(() => {
    return taxpayers
      .map((tp) => ({
        ...tp,
        currentDelay: getTaxpayerDelay(tp.due_date),
        currentRisk: getTaxpayerRisk(tp.due_date),
        isPaid: isTaxpayerPaid(tp.taxpayer_id),
      }))
      .filter((tp) => tp.currentDelay > 10 && !tp.isPaid)
      .sort((a, b) => b.currentDelay - a.currentDelay);
  }, [taxpayers, getTaxpayerDelay, getTaxpayerRisk, isTaxpayerPaid]);
  
  // Filter taxpayers for search
  const filteredTaxpayers = useMemo(() => {
    if (!searchQuery) return overdueTaxpayers;
    return overdueTaxpayers.filter((tp) =>
      tp.taxpayer_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [overdueTaxpayers, searchQuery]);
  
  // Handle run automation
  const handleRunAutomation = async () => {
    toast.info('Starting automation run...');
    try {
      const results = await runAutomation(overdueTaxpayers);
      const nudgesSent = results.filter((r) => r.message_sent).length;
      toast.success(`Automation complete! ${nudgesSent} nudges sent.`);
    } catch (error) {
      toast.error('Automation failed');
    }
  };
  
  // Handle simulate payment
  const handleSimulatePayment = (taxpayer: typeof overdueTaxpayers[0]) => {
    const amount = Math.abs(taxpayer.arrears_amount) * 1000; // Convert to actual amount
    simulatePaymentForTaxpayer(taxpayer, amount);
    toast.success(`Payment simulated for ${taxpayer.taxpayer_id}`);
  };
  
  // Handle manual nudge
  const handleManualNudge = async (taxpayer: typeof overdueTaxpayers[0]) => {
    try {
      await sendManualNudge(taxpayer);
      toast.success(`Nudge sent to ${taxpayer.taxpayer_id}`);
    } catch (error) {
      toast.error('Failed to send nudge');
    }
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.totalOverdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-destructive">{stats.highRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Nudges</p>
                <p className="text-2xl font-bold">{stats.pendingNudges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto Nudges</p>
                <p className="text-2xl font-bold">{logStats.automatedNudges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Scheduler Control */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automation Scheduler
              </CardTitle>
              <CardDescription>
                Time-driven workflow for detecting missed due dates and sending automated reminders
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={schedulerState.status === 'running' ? 'default' : 'outline'}>
                {schedulerState.status.toUpperCase()}
              </Badge>
              <Button
                onClick={handleRunAutomation}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Scheduler
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {progress && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing taxpayers...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overdue Taxpayers
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Zap className="h-4 w-4" />
            Automation Rules
          </TabsTrigger>
        </TabsList>
        
        {/* Overdue Taxpayers Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Overdue Taxpayers ({overdueTaxpayers.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Tax ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taxpayer ID</TableHead>
                      <TableHead>Tax Type</TableHead>
                      <TableHead className="text-center">Delay Days</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead className="text-right">Arrears</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaxpayers.slice(0, 20).map((tp) => (
                      <TableRow key={tp.taxpayer_id}>
                        <TableCell className="font-medium">{tp.taxpayer_id}</TableCell>
                        <TableCell>{TAX_TYPE_MAP[tp.tax_type]}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {tp.currentDelay} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={riskColors[tp.currentRisk]}>
                            {tp.currentRisk.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Math.abs(tp.arrears_amount * 1000).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(tp.due_date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManualNudge(tp)}
                              className="gap-1"
                            >
                              <Send className="h-3 w-3" />
                              Nudge
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSimulatePayment(tp)}
                              className="gap-1"
                            >
                              <IndianRupee className="h-3 w-3" />
                              Pay
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTaxpayers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No overdue taxpayers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Activity Log ({activityLogs.length} events)</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Bot className="h-3 w-3" />
                    Auto: {logStats.automatedNudges}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <User className="h-3 w-3" />
                    Manual: {logStats.manualNudges}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {activityLogs.slice(0, 50).map((log) => {
                    const config = eventTypeConfig[log.event_type];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className={`p-2 rounded-full bg-background ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{log.taxpayer_id}</span>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {log.automated && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Bot className="h-3 w-3" />
                                Auto
                              </Badge>
                            )}
                            {log.channel && (
                              <Badge variant="outline" className="text-xs">
                                {log.channel.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          {log.message && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {log.message}
                            </p>
                          )}
                          {log.old_risk && log.new_risk && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Risk: <Badge className={riskColors[log.old_risk]} variant="outline">{log.old_risk}</Badge>
                              {' → '}
                              <Badge className={riskColors[log.new_risk]} variant="outline">{log.new_risk}</Badge>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(log.timestamp)} • Delay: {log.delay_days} days
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {activityLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity yet. Run the scheduler to generate events.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Delay-Based Rules
                </CardTitle>
                <CardDescription>
                  Automatic risk escalation based on payment delay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
                  <p className="font-medium text-green-700 dark:text-green-400">0-10 Days: Low Risk</p>
                  <p className="text-sm text-muted-foreground">No action required</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg">
                  <p className="font-medium text-amber-700 dark:text-amber-400">11-30 Days: Medium Risk</p>
                  <p className="text-sm text-muted-foreground">SMS reminder (gentle tone)</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 rounded-r-lg">
                  <p className="font-medium text-orange-700 dark:text-orange-400">31-45 Days: Medium Risk</p>
                  <p className="text-sm text-muted-foreground">Strong SMS reminder (firm tone)</p>
                </div>
                
                <div className="p-3 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                  <p className="font-medium text-red-700 dark:text-red-400">46+ Days: High Risk</p>
                  <p className="text-sm text-muted-foreground">WhatsApp / Urgent SMS (urgent tone)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Follow-up Rules
                </CardTitle>
                <CardDescription>
                  Escalating reminders for pending payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="font-medium">Initial Reminder</p>
                  <p className="text-sm text-muted-foreground">
                    Sent when due date is missed and delay exceeds 10 days
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="font-medium">Follow-up (5 days)</p>
                  <p className="text-sm text-muted-foreground">
                    If payment still pending after 5 days of initial nudge
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="font-medium">Final Notice (Attempt 3+)</p>
                  <p className="text-sm text-muted-foreground">
                    Escalated warning about legal action
                  </p>
                </div>
                
                <div className="p-3 border border-green-500 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="font-medium text-green-700 dark:text-green-400">Payment Received</p>
                  <p className="text-sm text-muted-foreground">
                    Risk downgraded to Low, all nudges stopped automatically
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Channel Routing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <Badge className="mb-2 bg-amber-500">Medium Risk</Badge>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">Standard reminders</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Badge className="mb-2 bg-red-500">High Risk</Badge>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Urgent notifications</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Badge className="mb-2" variant="outline">Fallback</Badge>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-muted-foreground">If WhatsApp unavailable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
