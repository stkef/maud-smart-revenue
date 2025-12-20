import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types/taxpayer';

interface RiskScoreGaugeProps {
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskScoreGauge({ score, level, size = 'md' }: RiskScoreGaugeProps) {
  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-destructive',
  };

  const strokeColors = {
    low: 'stroke-success',
    medium: 'stroke-warning',
    high: 'stroke-destructive',
  };

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className={cn('relative', sizeClasses[size])}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn('transition-all duration-1000 ease-out', strokeColors[level])}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textSizes[size], colorClasses[level])}>
          {percentage}%
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Default Risk
        </span>
      </div>
    </div>
  );
}
