import React from 'react';
import { Calendar, CheckCircle2, ShieldCheck, Database, HelpCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  latestDate?: string | null;
  modelStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  latestDate,
  modelStatus = 'Random Forest Active',
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-surface-border px-8 py-4 sticky top-0 z-20 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-content-primary tracking-tight">{title}</h1>
        {description && (
          <p className="text-xs text-content-secondary mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Market Data As-Of Badge */}
        {latestDate && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-bg border border-surface-border text-xs text-content-secondary">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span>Data As-Of: <strong className="text-content-primary font-semibold">{latestDate}</strong></span>
          </div>
        )}

        {/* System Date Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-bg border border-surface-border text-xs text-content-secondary">
          <Calendar className="w-3.5 h-3.5 text-content-muted" />
          <span>{currentDate}</span>
        </div>

        {/* Model Health Status Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{modelStatus}</span>
        </div>
      </div>
    </header>
  );
};
