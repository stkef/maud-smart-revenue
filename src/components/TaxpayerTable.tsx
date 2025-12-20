import { useState, useMemo } from 'react';
import { Taxpayer, RiskLevel, TaxType } from '@/types/taxpayer';
import { RiskBadge } from './RiskBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxpayerTableProps {
  taxpayers: Taxpayer[];
  onSelectTaxpayer: (taxpayer: Taxpayer) => void;
}

const ITEMS_PER_PAGE = 10;

export function TaxpayerTable({ taxpayers, onSelectTaxpayer }: TaxpayerTableProps) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [taxTypeFilter, setTaxTypeFilter] = useState<TaxType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTaxpayers = useMemo(() => {
    return taxpayers.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.ward.toLowerCase().includes(search.toLowerCase()) ||
        t.zone.toLowerCase().includes(search.toLowerCase());
      
      const matchesRisk = riskFilter === 'all' || t.riskLevel === riskFilter;
      const matchesTaxType = taxTypeFilter === 'all' || t.taxType === taxTypeFilter;
      
      return matchesSearch && matchesRisk && matchesTaxType;
    });
  }, [taxpayers, search, riskFilter, taxTypeFilter]);

  const totalPages = Math.ceil(filteredTaxpayers.length / ITEMS_PER_PAGE);
  const paginatedTaxpayers = filteredTaxpayers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, ward, or zone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={riskFilter}
            onValueChange={(value) => {
              setRiskFilter(value as RiskLevel | 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={taxTypeFilter}
            onValueChange={(value) => {
              setTaxTypeFilter(value as TaxType | 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tax Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Property Tax">Property Tax</SelectItem>
              <SelectItem value="Water Tax">Water Tax</SelectItem>
              <SelectItem value="Drainage Tax">Drainage Tax</SelectItem>
              <SelectItem value="Commercial Tax">Commercial Tax</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {paginatedTaxpayers.length} of {filteredTaxpayers.length} taxpayers
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Taxpayer ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Ward / Zone</TableHead>
              <TableHead className="font-semibold">Tax Type</TableHead>
              <TableHead className="font-semibold text-right">Total Due</TableHead>
              <TableHead className="font-semibold">Risk Level</TableHead>
              <TableHead className="font-semibold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTaxpayers.map((taxpayer, index) => (
              <TableRow
                key={taxpayer.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                )}
                onClick={() => onSelectTaxpayer(taxpayer)}
              >
                <TableCell className="font-mono text-sm font-medium">
                  {taxpayer.id}
                </TableCell>
                <TableCell className="font-medium">{taxpayer.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {taxpayer.ward} / {taxpayer.zone}
                </TableCell>
                <TableCell>{taxpayer.taxType}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(taxpayer.totalDue)}
                </TableCell>
                <TableCell>
                  <RiskBadge level={taxpayer.riskLevel} size="sm" />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTaxpayer(taxpayer);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
