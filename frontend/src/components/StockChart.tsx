import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface StockChartProps {
  data: any[];
  symbols: string[];
  isNormalized?: boolean;
}

const STOCK_COLORS: Record<string, string> = {
  'RELIANCE.NS': '#1463E8', // Primary Blue
  'TCS.NS': '#20C7C9',      // Teal
  'INFY.NS': '#F59E0B',     // Amber
  'HDFCBANK.NS': '#8B5CF6', // Purple
  'USER_STOCK': '#10B981',  // Emerald
};

export const StockChart: React.FC<StockChartProps> = ({
  data,
  symbols,
  isNormalized = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
        <p className="font-medium">No stock price data available for selected criteria.</p>
        <p className="text-xs text-slate-400 mt-1">Check that data is loaded or adjust filter range.</p>
      </div>
    );
  }

  // Sample data points if too dense (> 400 points) to optimize rendering speed
  const sampledData = React.useMemo(() => {
    if (data.length <= 400) return data;
    const step = Math.ceil(data.length / 350);
    return data.filter((_, idx) => idx % step === 0 || idx === data.length - 1);
  }, [data]);

  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    try {
      const parts = tickItem.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[0].slice(2)}`;
      }
      return tickItem;
    } catch {
      return tickItem;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-surface-border rounded-lg shadow-lg text-xs space-y-1 z-50">
          <p className="font-semibold text-content-primary border-b pb-1 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-content-secondary font-medium">{entry.name}:</span>
              </span>
              <span className="font-bold text-content-primary">
                {isNormalized ? `${entry.value?.toFixed(1)} (Base 100)` : `₹${entry.value?.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampledData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            minTickGap={30}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            domain={['auto', 'auto']}
            tickFormatter={(v) => (isNormalized ? `${v}` : `₹${v}`)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
          />
          {symbols.map((sym) => (
            <Line
              key={sym}
              type="monotone"
              dataKey={sym}
              name={sym.replace('.NS', '')}
              stroke={STOCK_COLORS[sym] || '#1463E8'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
