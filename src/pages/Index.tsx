import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { RiskDistributionChart } from '@/components/RiskDistributionChart';
import { TaxpayerTableLive } from '@/components/TaxpayerTableLive';
import { TaxpayerProfileLive } from '@/components/TaxpayerProfileLive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaxpayers, useDashboardStats, TaxpayerWithRisk } from '@/hooks/useTaxpayers';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  PieChart,
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: taxpayers, isLoading: taxpayersLoading } = useTaxpayers();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<TaxpayerWithRisk | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const riskDistributionData = stats ? {
    low: stats.lowRiskCount,
    medium: stats.mediumRiskCount,
    high: stats.highRiskCount,
  } : { low: 0, medium: 0, high: 0 };

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

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-[140px]" />
              <Skeleton className="h-[140px]" />
              <Skeleton className="h-[140px]" />
              <Skeleton className="h-[140px]" />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Taxpayers"
                value={stats?.totalTaxpayers.toLocaleString() || '0'}
                subtitle="Registered taxpayers"
                icon={Users}
                variant="primary"
              />
              <StatsCard
                title="High Risk"
                value={stats?.highRiskCount.toString() || '0'}
                subtitle="Immediate attention required"
                icon={AlertTriangle}
                variant="destructive"
              />
              <StatsCard
                title="Medium Risk"
                value={stats?.mediumRiskCount.toString() || '0'}
                subtitle="Monitor closely"
                icon={AlertCircle}
                variant="accent"
              />
              <StatsCard
                title="Low Risk"
                value={stats?.lowRiskCount.toString() || '0'}
                subtitle="Good standing"
                icon={CheckCircle}
                variant="success"
              />
            </>
          )}
        </div>

        {/* Risk Distribution Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <RiskDistributionChart data={riskDistributionData} />
            )}
          </CardContent>
        </Card>

        {/* Taxpayer Table Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Taxpayer Records</CardTitle>
          </CardHeader>
          <CardContent>
            <TaxpayerTableLive
              taxpayers={taxpayers || []}
              isLoading={taxpayersLoading}
              onSelectTaxpayer={setSelectedTaxpayer}
            />
          </CardContent>
        </Card>
      </main>

      {/* Taxpayer Profile Slide-over */}
      {selectedTaxpayer && (
        <TaxpayerProfileLive
          taxpayer={selectedTaxpayer}
          onClose={() => setSelectedTaxpayer(null)}
        />
      )}
    </div>
  );
}
