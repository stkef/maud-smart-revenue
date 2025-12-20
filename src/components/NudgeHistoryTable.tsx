import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Mail, Phone, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import { useMessagingIntegration, NudgeState } from '@/hooks/useMessagingIntegration';

const riskColors: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { 
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', 
    icon: <Clock className="h-3 w-3" /> 
  },
  sent: { 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    icon: <CheckCircle className="h-3 w-3" /> 
  },
  delivered: { 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
    icon: <CheckCircle className="h-3 w-3" /> 
  },
  failed: { 
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', 
    icon: <XCircle className="h-3 w-3" /> 
  },
};

const channelIcons: Record<string, React.ReactNode> = {
  sms: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
};

export function NudgeHistoryTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const { getAllNudgeStates, clearNudgeHistory, providerInfo } = useMessagingIntegration();
  
  const nudgeStates = getAllNudgeStates();

  const filteredNudges = useMemo(() => {
    return nudgeStates.filter((state) =>
      state.taxpayerId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nudgeStates, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Nudge History ({nudgeStates.length} total)
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>Provider:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {providerInfo.provider.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Taxpayer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            {nudgeStates.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearNudgeHistory}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNudges.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {nudgeStates.length === 0 
              ? "No nudges sent yet. Send your first nudge from the High Risk or All Taxpayers tab."
              : "No nudges found matching your search."}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-muted-foreground font-medium">Taxpayer ID</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Channel</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Provider</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Sent At</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Message ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNudges.map((state) => (
                  <TableRow key={state.taxpayerId} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm text-foreground">
                      {state.taxpayerId}
                    </TableCell>
                    <TableCell>
                      {state.result ? (
                        <div className="flex items-center gap-2 text-muted-foreground capitalize">
                          {channelIcons[state.result.channel]}
                          {state.result.channel}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {state.result ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {state.result.provider.toUpperCase()}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig[state.status].color} flex items-center gap-1 w-fit`}
                      >
                        {statusConfig[state.status].icon}
                        {state.status.charAt(0).toUpperCase() + state.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {state.result?.timestamp ? formatDate(state.result.timestamp) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                      {state.result?.messageId || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
