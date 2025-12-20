import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { LocalTaxpayer, useNudgeState, TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';
import { LocalNudgeModal } from './LocalNudgeModal';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface HighRiskTableProps {
  taxpayers: LocalTaxpayer[];
}

export function HighRiskTable({ taxpayers }: HighRiskTableProps) {
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<LocalTaxpayer | null>(null);
  const { sendNudge, isNudgeSent } = useNudgeState();
  const { isAdmin } = useUserRoles();

  // Filter only high-risk taxpayers, sorted by risk probability
  const highRiskTaxpayers = useMemo(() => {
    return taxpayers
      .filter((tp) => tp.riskLevel === 'high')
      .sort((a, b) => b.default_risk_probability - a.default_risk_probability)
      .slice(0, 20); // Top 20 high-risk
  }, [taxpayers]);

  const handleNudgeConfirm = (message: string) => {
    if (selectedTaxpayer) {
      sendNudge(selectedTaxpayer.taxpayer_id, selectedTaxpayer.riskLevel, message);
      toast.success(`Early reminder sent to ${selectedTaxpayer.taxpayer_id}`);
    }
  };

  const formatAmount = (value: number) => {
    const scaled = Math.abs(value) * 10000;
    if (scaled >= 100000) return `₹${(scaled / 100000).toFixed(1)}L`;
    if (scaled >= 1000) return `₹${(scaled / 1000).toFixed(1)}K`;
    return `₹${Math.round(scaled)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <CardTitle className="text-lg font-semibold">High Risk Taxpayers</CardTitle>
            <CardDescription>Priority list for targeted enforcement and early intervention</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-destructive/5">
                <TableHead className="font-semibold">Taxpayer ID</TableHead>
                <TableHead className="font-semibold">Ward</TableHead>
                <TableHead className="font-semibold">Tax Type</TableHead>
                <TableHead className="font-semibold text-right">Due Amount</TableHead>
                <TableHead className="font-semibold text-right">Arrears</TableHead>
                <TableHead className="font-semibold text-center">Risk Score</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                {isAdmin && <TableHead className="font-semibold text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {highRiskTaxpayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No high-risk taxpayers found
                  </TableCell>
                </TableRow>
              ) : (
                highRiskTaxpayers.map((tp) => (
                  <TableRow key={tp.taxpayer_id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{tp.taxpayer_id}</TableCell>
                    <TableCell>Ward {tp.ward}</TableCell>
                    <TableCell>{TAX_TYPE_MAP[tp.tax_type] || `Type ${tp.tax_type}`}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(tp.due_amount)}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{formatAmount(tp.arrears_amount)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono font-bold text-destructive">
                        {(tp.default_risk_probability * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-destructive text-destructive-foreground">
                        High Risk
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {isNudgeSent(tp.taxpayer_id) ? (
                          <Button variant="ghost" size="sm" disabled>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Sent
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedTaxpayer(tp)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Alert
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing top {highRiskTaxpayers.length} high-risk taxpayers sorted by default probability
        </div>

        {selectedTaxpayer && (
          <LocalNudgeModal
            isOpen={!!selectedTaxpayer}
            onClose={() => setSelectedTaxpayer(null)}
            taxpayerId={selectedTaxpayer.taxpayer_id}
            riskLevel={selectedTaxpayer.riskLevel}
            onConfirm={handleNudgeConfirm}
          />
        )}
      </CardContent>
    </Card>
  );
}
