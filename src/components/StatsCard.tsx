import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const variantClasses = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  accent: 'gradient-accent text-accent-foreground',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  destructive: 'bg-destructive/10 border-destructive/20',
};

const iconVariantClasses = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  accent: 'bg-accent-foreground/20 text-accent-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/20 text-destructive',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const isSpecialVariant = variant === 'primary' || variant === 'accent';
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6 shadow-card transition-all duration-300 hover:shadow-card-hover',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            isSpecialVariant ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-3xl font-bold tracking-tight animate-fade-in',
              isSpecialVariant ? 'text-primary-foreground' : 'text-foreground'
            )}>
              {value}
            </span>
            {trend && (
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className={cn(
              'text-sm',
              isSpecialVariant ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-3 transition-transform duration-300 hover:scale-110',
          iconVariantClasses[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Decorative element */}
      {isSpecialVariant && (
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      )}
    </div>
  );
}
