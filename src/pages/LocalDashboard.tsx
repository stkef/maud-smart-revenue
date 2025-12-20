import { useLocalTaxpayers, useLocalDashboardStats } from '@/hooks/useLocalTaxpayers';
import { LocalKPICards } from '@/components/LocalKPICards';
import { LocalRiskChart } from '@/components/LocalRiskChart';
import { LocalTaxpayerTable } from '@/components/LocalTaxpayerTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LocalDashboard() {
  const { data: taxpayers } = useLocalTaxpayers();
  const { data: stats } = useLocalDashboardStats();
  const { user, signOut } = useAuth();

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
                <h1 className="text-xl font-bold">Officer Dashboard</h1>
                <p className="text-sm text-muted-foreground">Tax Collection Risk Management</p>
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
        <LocalKPICards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LocalRiskChart stats={stats} />
          
          <Card className="lg:col-span-2">
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
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Taxpayer Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <LocalTaxpayerTable taxpayers={taxpayers} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
