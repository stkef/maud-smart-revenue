import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types/taxpayer';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const config = {
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    classes: 'bg-success/10 text-success border-success/20',
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertCircle,
    classes: 'bg-warning/10 text-warning border-warning/20',
  },
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    classes: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function RiskBadge({ level, showIcon = true, size = 'md', className }: RiskBadgeProps) {
  const { label, icon: Icon, classes } = config[level];
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        classes,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      {label}
    </span>
  );
}
