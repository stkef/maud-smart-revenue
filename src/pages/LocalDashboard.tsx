import { useLocalTaxpayers, useLocalDashboardStats, useNudgeState } from '@/hooks/useLocalTaxpayers';
import { LocalKPICards } from '@/components/LocalKPICards';
import { LocalRiskChart } from '@/components/LocalRiskChart';
import { LocalTaxpayerTable } from '@/components/LocalTaxpayerTable';
import { WardRiskChart } from '@/components/WardRiskChart';
import { ArrearsRecoveryChart } from '@/components/ArrearsRecoveryChart';
import { RiskFactorsPanel } from '@/components/RiskFactorsPanel';
import { HighRiskTable } from '@/components/HighRiskTable';
import { NudgeHistoryTable } from '@/components/NudgeHistoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, LogOut, BarChart3, Users, AlertTriangle, Brain, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LocalDashboard() {
  const { data: taxpayers } = useLocalTaxpayers();
  const { data: stats } = useLocalDashboardStats();
  const { getNudgeHistory } = useNudgeState();
  const { user, signOut } = useAuth();
  const nudgeHistory = getNudgeHistory();

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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="high-risk" className="gap-2">
              <AlertTriangle className="h-4 w-4 hidden sm:inline" />
              High Risk
            </TabsTrigger>
            <TabsTrigger value="all-taxpayers" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              All Taxpayers
            </TabsTrigger>
            <TabsTrigger value="nudge-history" className="gap-2">
              <MessageSquare className="h-4 w-4 hidden sm:inline" />
              Nudges {nudgeHistory.length > 0 && `(${nudgeHistory.length})`}
            </TabsTrigger>
            <TabsTrigger value="explainability" className="gap-2">
              <Brain className="h-4 w-4 hidden sm:inline" />
              Insights
            </TabsTrigger>
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
                  <CardTitle className="text-lg font-semibold">Behavioral Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border-l-4 border-l-destructive bg-destructive/5 rounded-r-lg">
                    <p className="text-sm font-medium text-destructive">High Risk ({stats.highRiskCount})</p>
                    <p className="text-xs text-muted-foreground">Early & firm reminders for immediate payment</p>
                  </div>
                  <div className="p-3 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 rounded-r-lg">
                    <p className="text-sm font-medium text-yellow-600">Medium Risk ({stats.mediumRiskCount})</p>
                    <p className="text-xs text-muted-foreground">Deadline-focused reminders to prevent late payment</p>
                  </div>
                  <div className="p-3 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
                    <p className="text-sm font-medium text-green-600">Low Risk ({stats.lowRiskCount})</p>
                    <p className="text-xs text-muted-foreground">Polite informational nudges for continued compliance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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

          {/* Nudge History Tab */}
          <TabsContent value="nudge-history" className="space-y-6">
            <NudgeHistoryTable nudges={nudgeHistory} />
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
        </Tabs>
      </main>
    </div>
  );
}
