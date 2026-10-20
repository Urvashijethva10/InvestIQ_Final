import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'neutral';
  trend?: string;
  trendPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  trend,
  trendPositive,
}) => {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-primary border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card hover:shadow-hover transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-content-primary">{value}</span>
            {badge && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles[badgeType]}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-content-secondary">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={trendPositive ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-medium'}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
