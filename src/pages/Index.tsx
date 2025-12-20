import { useState } from 'react';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { RiskDistributionChart } from '@/components/RiskDistributionChart';
import { ArrearsTrendChart } from '@/components/ArrearsTrendChart';
import { TaxpayerTable } from '@/components/TaxpayerTable';
import { TaxpayerProfile } from '@/components/TaxpayerProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockTaxpayers, mockDashboardStats } from '@/data/mockData';
import { Taxpayer } from '@/types/taxpayer';
import {
  Building2,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Users,
  Send,
  PieChart,
  BarChart3,
} from 'lucide-react';

export default function Index() {
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null);
  const stats = mockDashboardStats;

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Officer Dashboard</h2>
          <p className="text-muted-foreground">
            AI-powered tax compliance monitoring and defaulter prediction
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Properties"
            value={stats.totalProperties.toLocaleString()}
            subtitle="Registered taxpayers"
            icon={Building2}
            variant="primary"
          />
          <StatsCard
            title="Total Due Amount"
            value={formatCurrency(stats.totalDueAmount)}
            subtitle="Pending collection"
            icon={IndianRupee}
            trend={{ value: 12.5, isPositive: false }}
          />
          <StatsCard
            title="Expected Recovery"
            value={formatCurrency(stats.expectedRecovery)}
            subtitle="AI predicted"
            icon={TrendingUp}
            variant="accent"
          />
          <StatsCard
            title="High Risk Cases"
            value={stats.riskDistribution.high}
            subtitle={`${((stats.riskDistribution.high / stats.totalProperties) * 100).toFixed(1)}% of total`}
            icon={AlertTriangle}
            variant="destructive"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-5 w-5 text-primary" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart data={stats.riskDistribution} />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Arrears Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ArrearsTrendChart data={stats.arrearsTrend} />
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Nudges Sent"
            value={stats.nudgesSent.toLocaleString()}
            subtitle="This month"
            icon={Send}
          />
          <StatsCard
            title="Response Rate"
            value={`${stats.responseRate}%`}
            subtitle="Payment after reminder"
            icon={Users}
            variant="success"
          />
          <StatsCard
            title="ML Accuracy"
            value="91.2%"
            subtitle="Prediction accuracy"
            icon={TrendingUp}
            variant="accent"
          />
        </div>

        {/* Taxpayer Table Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Taxpayer Records</CardTitle>
          </CardHeader>
          <CardContent>
            <TaxpayerTable
              taxpayers={mockTaxpayers}
              onSelectTaxpayer={setSelectedTaxpayer}
            />
          </CardContent>
        </Card>
      </main>

      {/* Taxpayer Profile Slide-over */}
      {selectedTaxpayer && (
        <TaxpayerProfile
          taxpayer={selectedTaxpayer}
          onClose={() => setSelectedTaxpayer(null)}
        />
      )}
    </div>
  );
}
