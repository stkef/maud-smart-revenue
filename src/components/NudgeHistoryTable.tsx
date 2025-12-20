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
import { Search, MessageSquare, Mail, Phone, CheckCircle, Clock, XCircle } from 'lucide-react';

export interface NudgeRecord {
  id: string;
  taxpayerId: string;
  riskLevel: 'low' | 'medium' | 'high';
  nudgeType: 'sms' | 'whatsapp' | 'email';
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: string;
}

interface NudgeHistoryTableProps {
  nudges: NudgeRecord[];
}

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

export function NudgeHistoryTable({ nudges }: NudgeHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNudges = useMemo(() => {
    return nudges.filter((nudge) =>
      nudge.taxpayerId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nudges, searchQuery]);

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
          <CardTitle className="text-lg font-semibold text-foreground">
            Nudge History ({nudges.length} total)
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Taxpayer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNudges.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {nudges.length === 0 
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
                  <TableHead className="text-muted-foreground font-medium">Risk Level</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Sent At</TableHead>
                  <TableHead className="text-muted-foreground font-medium max-w-xs">Message Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNudges.map((nudge) => (
                  <TableRow key={nudge.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm text-foreground">
                      {nudge.taxpayerId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground capitalize">
                        {channelIcons[nudge.nudgeType]}
                        {nudge.nudgeType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskColors[nudge.riskLevel]}>
                        {nudge.riskLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig[nudge.status].color} flex items-center gap-1 w-fit`}
                      >
                        {statusConfig[nudge.status].icon}
                        {nudge.status.charAt(0).toUpperCase() + nudge.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(nudge.sentAt)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate" title={nudge.message}>
                        {nudge.message.slice(0, 60)}...
                      </p>
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
