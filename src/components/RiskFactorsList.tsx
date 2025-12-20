import { RiskFactor } from '@/types/taxpayer';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RiskFactorsListProps {
  factors: RiskFactor[];
}

export function RiskFactorsList({ factors }: RiskFactorsListProps) {
  return (
    <div className="space-y-3">
      {factors.map((factor, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3 transition-all duration-200',
            factor.impact === 'positive'
              ? 'border-success/20 bg-success/5'
              : 'border-destructive/20 bg-destructive/5'
          )}
        >
          <div
            className={cn(
              'mt-0.5 rounded-full p-1.5',
              factor.impact === 'positive'
                ? 'bg-success/20 text-success'
                : 'bg-destructive/20 text-destructive'
            )}
          >
            {factor.impact === 'positive' ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{factor.factor}</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{factor.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    factor.impact === 'positive' ? 'bg-success' : 'bg-destructive'
                  )}
                  style={{ width: `${factor.weight * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {Math.round(factor.weight * 100)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
