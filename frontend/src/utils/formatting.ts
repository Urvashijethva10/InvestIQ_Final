/**
 * Formatting and visual presentation helpers for InvestIQ.
 */

export function formatPercent(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${(val * 100).toFixed(decimals)}%`;
}

export function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(val: number | null | undefined, decimals = 4): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(decimals);
}

export function getRiskBadgeStyle(risk: string) {
  const norm = risk.toLowerCase();
  if (norm.includes('low')) {
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      badge: 'border-emerald-300 bg-emerald-50 text-emerald-800'
    };
  }
  if (norm.includes('high')) {
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      badge: 'border-rose-300 bg-rose-50 text-rose-800'
    };
  }
  // Medium
  return {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    badge: 'border-amber-300 bg-amber-50 text-amber-800'
  };
}
