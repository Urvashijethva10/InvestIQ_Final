import React from 'react';
import { getRiskBadgeStyle } from '../utils/formatting';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  level: 'Low Risk' | 'Medium Risk' | 'High Risk' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const styles = getRiskBadgeStyle(level);
  const norm = level.toLowerCase();

  const IconComponent = norm.includes('low')
    ? ShieldCheck
    : norm.includes('high')
    ? ShieldAlert
    : AlertTriangle;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1 font-medium',
    md: 'text-sm px-3 py-1 space-x-1.5 font-semibold',
    lg: 'text-base px-4 py-1.5 space-x-2 font-bold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${styles.badge} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
      {showIcon && <IconComponent className={iconSizes[size]} />}
      <span>{level}</span>
    </span>
  );
};
