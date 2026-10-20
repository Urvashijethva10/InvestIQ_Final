import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data and model intelligence...',
  subtext = 'Fetching verified artifacts from the InvestIQ backend...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-surface-border shadow-card min-h-[300px]">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <p className="text-sm font-semibold text-content-primary">{message}</p>
      {subtext && <p className="text-xs text-content-secondary mt-1 text-center max-w-sm">{subtext}</p>}
    </div>
  );
};
