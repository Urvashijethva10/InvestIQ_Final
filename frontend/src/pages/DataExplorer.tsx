import React, { useEffect, useState } from 'react';
import {
  Database,
  Calendar,
  Filter,
  Download,
  LineChart as LineChartIcon,
  Activity,
  Table as TableIcon,
  Search,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StockInfo, HistoricalRecord } from '../types';
import { Header } from '../components/Header';
import { DataTable } from '../components/DataTable';
import { StockChart } from '../components/StockChart';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatNumber, formatPercent } from '../utils/formatting';

export const DataExplorer: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE.NS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chart' | 'indicators' | 'table'>('chart');
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchStockHistory();
    }
  }, [selectedStock]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stockList = await apiClient.getSupportedStocks();
      setStocks(stockList);
      if (stockList.length > 0) {
        setSelectedStock(stockList[0].symbol);
        // Default start date: 2 years prior
        if (stockList[0].latest_date) {
          const d = new Date(stockList[0].latest_date);
          d.setFullYear(d.getFullYear() - 2);
          setStartDate(d.toISOString().split('T')[0]);
          setEndDate(stockList[0].latest_date);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Data Explorer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getStockHistory(
        selectedStock,
        startDate || undefined,
        endDate || undefined,
        false
      );
      setRecords(res.records || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve equity historical observations.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchStockHistory();
  };

  const handleExportCsv = () => {
    window.location.href = apiClient.exportHistoryUrl(selectedStock, startDate, endDate);
  };

  const chartData = React.useMemo(() => {
    return records.map((r) => ({
      date: r.date,
      [selectedStock]: r.close,
      RSI_14: r.RSI_14,
      Volatility_20: r.Volatility_20 ? r.Volatility_20 * 100 : undefined,
    }));
  }, [records, selectedStock]);

  const columns = [
    { key: 'date', header: 'Date' },
    {
      key: 'close',
      header: 'Close Price (INR)',
      align: 'right' as const,
      render: (r: HistoricalRecord) => `₹${r.close.toFixed(2)}`,
    },
    {
      key: 'Daily_Return',
      header: 'Daily Return',
      align: 'right' as const,
      render: (r: HistoricalRecord) => (
        <span className={r.Daily_Return && r.Daily_Return >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
          {formatPercent(r.Daily_Return, 2)}
        </span>
      ),
    },
    {
      key: 'Return_5D',
      header: '5D Return',
      align: 'right' as const,
      render: (r: HistoricalRecord) => formatPercent(r.Return_5D, 2),
    },
    {
      key: 'Return_20D',
      header: '20D Return',
      align: 'right' as const,
      render: (r: HistoricalRecord) => formatPercent(r.Return_20D, 2),
    },
    {
      key: 'Volatility_20',
      header: '20D Volatility',
      align: 'right' as const,
      render: (r: HistoricalRecord) => formatNumber(r.Volatility_20, 4),
    },
    {
      key: 'Volatility_5',
      header: '5D Volatility',
      align: 'right' as const,
      render: (r: HistoricalRecord) => formatNumber(r.Volatility_5, 4),
    },
    {
      key: 'RSI_14',
      header: 'RSI (14)',
      align: 'right' as const,
      render: (r: HistoricalRecord) => (
        <span className="font-bold">
          {r.RSI_14 ? r.RSI_14.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      key: 'Price_MA20_Ratio',
      header: 'MA20 Ratio',
      align: 'right' as const,
      render: (r: HistoricalRecord) => formatNumber(r.Price_MA20_Ratio, 3),
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Data Explorer"
        description="Filter and inspect historical time series, 8 technical indicator streams, and raw training data."
        modelStatus="Random Forest Active"
      />

      <div className="px-8 space-y-6">
        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-surface-border gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-content-primary">Historical Data Filters</h2>
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-surface-border rounded-lg text-xs font-semibold text-content-primary hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Download Filtered CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Stock Select */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                Selected Stock
              </label>
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol.replace('.NS', '')} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            {/* Apply Button */}
            <div>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-surface-border space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('chart')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'chart'
                ? 'border-primary text-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <LineChartIcon className="w-4 h-4" />
            <span>Price Trend Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('indicators')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'indicators'
                ? 'border-primary text-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Technical Indicator Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'table'
                ? 'border-primary text-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Tabular Dataset ({records.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <LoadingState message="Fetching historical market observations..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStockHistory} />
        ) : (
          <div>
            {activeTab === 'chart' && (
              <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div>
                    <h3 className="text-sm font-bold text-content-primary">
                      {selectedStock} Historical Closing Prices
                    </h3>
                    <p className="text-xs text-content-secondary mt-0.5">
                      Daily adjusted closing prices (INR) over selected date span.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-content-primary bg-slate-100 px-3 py-1 rounded-full">
                    {records.length} Points
                  </span>
                </div>
                <StockChart
                  data={chartData}
                  symbols={[selectedStock]}
                  isNormalized={false}
                />
              </div>
            )}

            {activeTab === 'indicators' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card">
                  <div className="pb-3 border-b border-surface-border mb-4">
                    <h3 className="text-sm font-bold text-content-primary">
                      Feature Schema & Statistical Profile
                    </h3>
                    <p className="text-xs text-content-secondary mt-0.5">
                      The exact 8 features utilized by the Random Forest classifier.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Daily_Return', desc: 'Single-day percentage change in adjusted close price.' },
                      { name: 'Return_5D', desc: '5-trading-day cumulative return momentum.' },
                      { name: 'Return_20D', desc: '20-trading-day cumulative return momentum.' },
                      { name: 'Volatility_5', desc: 'Rolling 5-day standard deviation of daily returns.' },
                      { name: 'Volatility_20', desc: 'Rolling 20-day standard deviation of daily returns (top feature).' },
                      { name: 'RSI_14', desc: 'Relative Strength Index over a 14-day rolling window.' },
                      { name: 'Price_MA5_Ratio', desc: 'Ratio of close price to its 5-day simple moving average.' },
                      { name: 'Price_MA20_Ratio', desc: 'Ratio of close price to its 20-day simple moving average.' },
                    ].map((feat) => (
                      <div key={feat.name} className="p-4 rounded-lg border border-slate-100 bg-surface-hover/30">
                        <span className="text-xs font-bold font-mono text-primary">{feat.name}</span>
                        <p className="text-[11px] text-content-secondary mt-1 leading-relaxed">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'table' && (
              <DataTable
                data={records}
                columns={columns}
                pageSize={15}
                title={`${selectedStock} Historical Data`}
                onExportCsv={handleExportCsv}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
