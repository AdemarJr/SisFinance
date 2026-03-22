import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={`shadow-card hover:shadow-lg transition-shadow ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg bg-accent ${iconColor}`}>
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            {value}
          </div>
          {trend && (
            <div
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
