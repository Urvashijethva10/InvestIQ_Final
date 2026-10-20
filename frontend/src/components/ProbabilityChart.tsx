import React from 'react';
import { formatPercent } from '../utils/formatting';

interface ProbabilityChartProps {
  probabilities: Record<string, number>;
  predictedLabel: string;
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({
  probabilities,
  predictedLabel,
}) => {
  const classes = [
    { label: 'Low Risk', key: 'Low Risk', color: 'bg-emerald-500', barBg: 'bg-emerald-100', text: 'text-emerald-700' },
    { label: 'Medium Risk', key: 'Medium Risk', color: 'bg-amber-500', barBg: 'bg-amber-100', text: 'text-amber-700' },
    { label: 'High Risk', key: 'High Risk', color: 'bg-rose-500', barBg: 'bg-rose-100', text: 'text-rose-700' },
  ];

  return (
    <div className="space-y-4">
      {classes.map((cls) => {
        const prob = probabilities[cls.key] ?? 0;
        const percent = Math.min(Math.max(prob * 100, 0), 100);
        const isPredicted = predictedLabel === cls.label;

        return (
          <div key={cls.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold flex items-center space-x-1.5 ${isPredicted ? cls.text : 'text-content-secondary'}`}>
                <span className={`w-2 h-2 rounded-full ${cls.color}`} />
                <span>{cls.label}</span>
                {isPredicted && (
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded border border-primary/20">
                    PREDICTED
                  </span>
                )}
              </span>
              <span className={`font-bold font-mono ${isPredicted ? 'text-content-primary text-sm' : 'text-content-secondary'}`}>
                {formatPercent(prob, 1)}
              </span>
            </div>

            {/* Probability Progress Bar */}
            <div className={`h-3 w-full rounded-full ${cls.barBg} overflow-hidden p-0.5`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${cls.color} ${isPredicted ? 'shadow-sm' : 'opacity-85'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
