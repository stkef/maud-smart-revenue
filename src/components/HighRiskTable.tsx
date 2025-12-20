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
import { Send, CheckCircle, AlertTriangle, Loader2, Phone, MessageSquare, Zap } from 'lucide-react';
import { LocalTaxpayer, TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';
import { LocalNudgeModal } from './LocalNudgeModal';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useMessagingIntegration } from '@/hooks/useMessagingIntegration';
import { toast } from 'sonner';

interface HighRiskTableProps {
  taxpayers: LocalTaxpayer[];
}

export function HighRiskTable({ taxpayers }: HighRiskTableProps) {
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<LocalTaxpayer | null>(null);
  const { isAdmin } = useUserRoles();
  const { 
    isNudgeSent, 
    getNudgeState, 
    providerInfo,
    sendHighRiskNudges,
    isSending,
    batchProgress,
  } = useMessagingIntegration();

  // Filter only high-risk taxpayers, sorted by risk probability
  const highRiskTaxpayers = useMemo(() => {
    return taxpayers
      .filter((tp) => tp.riskLevel === 'high')
      .sort((a, b) => b.default_risk_probability - a.default_risk_probability)
      .slice(0, 20); // Top 20 high-risk
  }, [taxpayers]);

  // Count unsent nudges
  const unsentCount = useMemo(() => {
    return highRiskTaxpayers.filter(tp => !isNudgeSent(tp.taxpayer_id)).length;
  }, [highRiskTaxpayers, isNudgeSent]);

  const handleBatchSend = async () => {
    const unsent = highRiskTaxpayers.filter(tp => !isNudgeSent(tp.taxpayer_id));
    if (unsent.length === 0) {
      toast.info('All high-risk taxpayers have already been notified');
      return;
    }

    toast.info(`Sending nudges to ${unsent.length} high-risk taxpayers...`);
    const results = await sendHighRiskNudges(taxpayers);
    
    const successful = results.filter(r => r.status === 'sent' || r.status === 'delivered').length;
    const failed = results.length - successful;
    
    if (successful > 0) {
      toast.success(`Successfully sent ${successful} nudges`);
    }
    if (failed > 0) {
      toast.error(`Failed to send ${failed} nudges`);
    }
  };

  const formatAmount = (value: number) => {
    const scaled = Math.abs(value) * 10000;
    if (scaled >= 100000) return `₹${(scaled / 100000).toFixed(1)}L`;
    if (scaled >= 1000) return `₹${(scaled / 1000).toFixed(1)}K`;
    return `₹${Math.round(scaled)}`;
  };

  const getNudgeStatusDisplay = (taxpayerId: string) => {
    const state = getNudgeState(taxpayerId);
    if (!state) return null;

    if (state.status === 'pending') {
      return (
        <Button variant="ghost" size="sm" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </Button>
      );
    }

    if (state.status === 'sent' && state.result) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Sent
          </Button>
          <Badge variant="outline" className="text-xs">
            {state.result.channel === 'whatsapp' ? (
              <MessageSquare className="h-3 w-3 mr-1" />
            ) : (
              <Phone className="h-3 w-3 mr-1" />
            )}
            {state.result.provider}
          </Badge>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-lg font-semibold">High Risk Taxpayers</CardTitle>
              <CardDescription>Priority list for targeted enforcement and early intervention</CardDescription>
            </div>
          </div>
          {isAdmin && unsentCount > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBatchSend}
              disabled={isSending}
            >
              {isSending && batchProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {batchProgress.completed}/{batchProgress.total}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Auto-Send All ({unsentCount})
                </>
              )}
            </Button>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>Provider:</span>
            <Badge variant="outline" className="font-mono">
              {providerInfo.provider.toUpperCase()}
            </Badge>
          </div>
        )}
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
                          getNudgeStatusDisplay(tp.taxpayer_id)
                        ) : getNudgeState(tp.taxpayer_id)?.status === 'pending' ? (
                          getNudgeStatusDisplay(tp.taxpayer_id)
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedTaxpayer(tp)}
                            disabled={isSending}
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
            taxpayer={selectedTaxpayer}
          />
        )}
      </CardContent>
    </Card>
  );
}
