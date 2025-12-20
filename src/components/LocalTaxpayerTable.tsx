import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Send, CheckCircle } from 'lucide-react';
import { LocalTaxpayer, RiskLevel, useNudgeState, TAX_TYPE_MAP } from '@/hooks/useLocalTaxpayers';
import { LocalNudgeModal } from './LocalNudgeModal';
import { toast } from 'sonner';

interface LocalTaxpayerTableProps {
  taxpayers: LocalTaxpayer[];
}

const riskColors: Record<RiskLevel, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-green-500 text-white',
};

export function LocalTaxpayerTable({ taxpayers }: LocalTaxpayerTableProps) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<LocalTaxpayer | null>(null);
  const { sendNudge, isNudgeSent } = useNudgeState();

  const filteredTaxpayers = useMemo(() => {
    return taxpayers.filter((tp) => {
      const taxTypeLabel = TAX_TYPE_MAP[tp.tax_type] || '';
      const matchesSearch =
        tp.taxpayer_id.toLowerCase().includes(search.toLowerCase()) ||
        `Ward ${tp.ward}`.toLowerCase().includes(search.toLowerCase()) ||
        `Zone ${tp.zone}`.toLowerCase().includes(search.toLowerCase()) ||
        taxTypeLabel.toLowerCase().includes(search.toLowerCase());

      const matchesRisk = riskFilter === 'all' || tp.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [taxpayers, search, riskFilter]);

  const handleNudgeConfirm = (message: string) => {
    if (selectedTaxpayer) {
      sendNudge(selectedTaxpayer.taxpayer_id, selectedTaxpayer.riskLevel, message);
      toast.success(`Nudge sent to ${selectedTaxpayer.taxpayer_id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, ward, zone, or tax type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Taxpayer ID</TableHead>
              <TableHead className="font-semibold">Ward</TableHead>
              <TableHead className="font-semibold">Zone</TableHead>
              <TableHead className="font-semibold">Tax Type</TableHead>
              <TableHead className="font-semibold">Risk Score</TableHead>
              <TableHead className="font-semibold">Risk Level</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTaxpayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No taxpayers found
                </TableCell>
              </TableRow>
            ) : (
              filteredTaxpayers.map((tp) => (
                <TableRow key={tp.taxpayer_id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{tp.taxpayer_id}</TableCell>
                  <TableCell>Ward {tp.ward}</TableCell>
                  <TableCell>Zone {tp.zone}</TableCell>
                  <TableCell>{TAX_TYPE_MAP[tp.tax_type] || `Type ${tp.tax_type}`}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {(tp.default_risk_probability * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={riskColors[tp.riskLevel]}>
                      {tp.riskLevel.charAt(0).toUpperCase() + tp.riskLevel.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isNudgeSent(tp.taxpayer_id) ? (
                      <Button variant="ghost" size="sm" disabled>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Sent
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTaxpayer(tp)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Nudge
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredTaxpayers.length} of {taxpayers.length} taxpayers
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
    </div>
  );
}
