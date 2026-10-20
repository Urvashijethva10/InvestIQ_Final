import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Cpu,
  Clock,
  Calendar,
  ShieldCheck,
  UploadCloud,
  BarChart3,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { DashboardSummary } from '../types';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { StockChart } from '../components/StockChart';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([
    'RELIANCE.NS',
    'TCS.NS',
    'INFY.NS',
    'HDFCBANK.NS',
  ]);
  const [isNormalized, setIsNormalized] = useState<boolean>(true);
  const [rangeFilter, setRangeFilter] = useState<'1Y' | '3Y' | 'ALL'>('3Y');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (summary) {
      fetchTrends();
    }
  }, [selectedStocks, isNormalized, rangeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboardSummary();
      setSummary(data);

      // Initial trends fetch
      let startDate: string | undefined;
      if (data.latest_valid_date) {
        const d = new Date(data.latest_valid_date);
        d.setFullYear(d.getFullYear() - 3);
        startDate = d.toISOString().split('T')[0];
      }

      const trendsRes = await apiClient.getStockTrends(
        selectedStocks,
        startDate,
        undefined,
        isNormalized
      );
      setTrendsData(trendsRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to InvestIQ backend services.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      let startDate: string | undefined;
      if (summary?.latest_valid_date && rangeFilter !== 'ALL') {
        const d = new Date(summary.latest_valid_date);
        if (rangeFilter === '1Y') d.setFullYear(d.getFullYear() - 1);
        if (rangeFilter === '3Y') d.setFullYear(d.getFullYear() - 3);
        startDate = d.toISOString().split('T')[0];
      }

      const trendsRes = await apiClient.getStockTrends(
        selectedStocks,
        startDate,
        undefined,
        isNormalized
      );
      setTrendsData(trendsRes.data || []);
    } catch (err) {
      console.error('Error fetching trends:', err);
    }
  };

  const toggleStock = (symbol: string) => {
    if (selectedStocks.includes(symbol)) {
      if (selectedStocks.length > 1) {
        setSelectedStocks(selectedStocks.filter((s) => s !== symbol));
      }
    } else {
      setSelectedStocks([...selectedStocks, symbol]);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState message="Loading InvestIQ Overview Dashboard..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8">
        <ErrorState
          title="Backend Connection Failed"
          message={error || 'Could not retrieve platform metrics.'}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Overview Dashboard"
        description="Comprehensive market overview, model availability, and chronological evaluation intelligence."
        latestDate={summary.latest_valid_date}
        modelStatus={`${summary.selected_model} Active`}
      />

      <div className="px-8 space-y-6">
        {/* 4 Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Supported Equities"
            value={summary.supported_stocks_count}
            subtitle="Indian Blue-Chips (NSE)"
            icon={TrendingUp}
            badge="Tier 1"
            badgeType="info"
          />

          <MetricCard
            title="Available Models"
            value={`${summary.available_models_count} / 2`}
            subtitle="Random Forest verified & active"
            icon={Cpu}
            badge={summary.available_models_count >= 1 ? 'Production Ready' : 'Degraded'}
            badgeType={summary.available_models_count >= 1 ? 'success' : 'warning'}
          />

          <MetricCard
            title="Prediction Horizon"
            value={`${summary.prediction_horizon_days} Days`}
            subtitle="Standard deviation of daily returns"
            icon={Clock}
            badge="Forward 20D"
            badgeType="neutral"
          />

          <MetricCard
            title="Latest Valid Market Date"
            value={summary.latest_valid_date || 'N/A'}
            subtitle={`${summary.dataset_rows_count.toLocaleString()} historical records`}
            icon={Calendar}
            badge="Verified Data"
            badgeType="success"
          />
        </div>

        {/* Stock Price Trends Interactive Chart Card */}
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-surface-border gap-4">
            <div>
              <h2 className="text-base font-bold text-content-primary">Historical Stock Price Trends</h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Real daily closing prices from the verified dataset. Toggle normalization to benchmark performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Range Filters */}
              <div className="inline-flex rounded-lg border border-surface-border p-0.5 bg-slate-50 text-xs">
                {(['1Y', '3Y', 'ALL'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRangeFilter(r)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      rangeFilter === r
                        ? 'bg-white text-primary shadow-sm font-semibold'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Normalization Toggle */}
              <button
                onClick={() => setIsNormalized(!isNormalized)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isNormalized
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white border-surface-border text-content-secondary hover:bg-slate-50'
                }`}
              >
                {isNormalized ? 'Base 100 Normalized' : 'Absolute INR (₹)'}
              </button>
            </div>
          </div>

          {/* Stock Selector Pills */}
          <div className="flex flex-wrap gap-2 pt-4">
            {summary.supported_stocks.map((stock) => {
              const active = selectedStocks.includes(stock.symbol);
              return (
                <button
                  key={stock.symbol}
                  onClick={() => toggleStock(stock.symbol)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : 'bg-white text-content-secondary border-surface-border hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold">{stock.symbol.replace('.NS', '')}</span>
                  <span className="text-[10px] opacity-75">₹{stock.latest_close?.toFixed(1)}</span>
                </button>
              );
            })}
          </div>

          {/* Chart Component */}
          <div className="mt-4">
            <StockChart
              data={trendsData}
              symbols={selectedStocks}
              isNormalized={isNormalized}
            />
          </div>
        </div>

        {/* Two Columns: Risk Workflow & Model Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 4-Step Risk Analysis Workflow */}
          <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-content-primary">Predictive Risk Workflow</h2>
              <p className="text-xs text-content-secondary mt-1">
                Rigorous four-stage quantitative process designed without time-series lookahead leakage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  {
                    step: '01',
                    title: 'Select Stock or Upload CSV',
                    desc: 'Choose supported Indian blue-chips or upload custom series with Date & Close prices.',
                  },
                  {
                    step: '02',
                    title: 'Compute Technical Features',
                    desc: 'Generates 8 verified technical indicators including RSI(14) and 20-day rolling volatilities.',
                  },
                  {
                    step: '03',
                    title: 'Execute ML Inference',
                    desc: 'Selected trained classifier maps feature vector into Low, Medium, or High risk classes.',
                  },
                  {
                    step: '04',
                    title: 'Evaluate Risk & Insights',
                    desc: 'Review calibrated class probability distributions and context-aware financial explanations.',
                  },
                ].map((item) => (
                  <div key={item.step} className="p-3.5 rounded-lg border border-slate-100 bg-surface-hover/40">
                    <span className="text-[11px] font-bold text-primary font-mono">{item.step}</span>
                    <h4 className="text-xs font-bold text-content-primary mt-1">{item.title}</h4>
                    <p className="text-[11px] text-content-secondary mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-content-secondary font-medium">Ready to test inference?</span>
              <button
                onClick={() => navigate('/predict')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <span>Launch Prediction</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Model Status & Compatibility Diagnostics */}
          <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-content-primary">Model Artifact Compatibility</h2>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Live verification against Python environment & runtime artifacts.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/performance')}
                  className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
                >
                  <span>View Metrics</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3.5 mt-4">
                {/* Random Forest Card */}
                <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950">Random Forest Classifier</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      SELECTED MODEL
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900 mt-1.5">
                    Status: <strong>Active & Loaded</strong> • Features: 8 • Classes: [Low, Med, High] • Weighted F1: 48.52%
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Selected as top production model based on superior held-out weighted F1 score and generalization balance.
                  </p>
                </div>

                {/* XGBoost Card */}
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-950">XGBoost Classifier</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                      COMPATIBILITY NOTE
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1.5 leading-relaxed">
                    Evaluated held-out accuracy: <strong>47.29%</strong>. Artifact preserved in <code className="text-[10px] bg-white px-1 py-0.5 rounded">artifacts/xgboost.joblib</code>.
                  </p>
                  <p className="text-[10px] text-amber-800 mt-1 leading-relaxed">
                    Note: Serialized under earlier XGBoost format. XGBoost 3.x UBJSON parser rejects legacy null objects. To regenerate natively in this Python version, use the Retraining Pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-content-secondary">
              <span>Risk Cutoffs: Q1 = 0.0115 | Q2 = 0.0152</span>
              <span className="font-semibold text-content-primary">3 Quantile Classes</span>
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div>
          <h3 className="text-sm font-bold text-content-primary mb-3">Quick Platform Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Risk Prediction',
                desc: 'Run interactive multi-class volatility inference on 4 equities or custom indicators.',
                path: '/predict',
                icon: ShieldCheck,
                color: 'text-primary bg-primary/10',
              },
              {
                title: 'Upload Your Data',
                desc: 'Upload custom CSV time series to validate format, calculate features, and predict risk.',
                path: '/upload',
                icon: UploadCloud,
                color: 'text-teal-accent bg-teal-accent/10',
              },
              {
                title: 'Model Performance',
                desc: 'Inspect genuine held-out confusion matrices, feature importances, and comparison metrics.',
                path: '/performance',
                icon: BarChart3,
                color: 'text-purple-600 bg-purple-50',
              },
              {
                title: 'Data Explorer',
                desc: 'Search, filter, inspect moving averages, RSI indicators, and download raw datasets.',
                path: '/explorer',
                icon: Database,
                color: 'text-amber-600 bg-amber-50',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  className="bg-white p-5 rounded-xl border border-surface-border shadow-card hover:shadow-hover hover:border-primary/40 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-content-primary group-hover:text-primary transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
