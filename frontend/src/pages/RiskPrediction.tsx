import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  Download,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Calendar,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { PredictionResult, StockInfo } from '../types';
import { Header } from '../components/Header';
import { RiskBadge } from '../components/RiskBadge';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatNumber, formatPercent } from '../utils/formatting';

export const RiskPrediction: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('RELIANCE.NS');
  const [selectedModel, setSelectedModel] = useState<string>('Random Forest');
  const [predictionMode, setPredictionMode] = useState<'market' | 'custom'>('market');
  const [customFeatures, setCustomFeatures] = useState<Record<string, number>>({
    Daily_Return: 0.005,
    Return_5D: 0.021,
    Volatility_20: 0.0142,
    RSI_14: 56.4,
    Price_MA5_Ratio: 1.012,
    Price_MA20_Ratio: 1.025,
    Return_20D: 0.038,
    Volatility_5: 0.011,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const stockList = await apiClient.getSupportedStocks();
      setStocks(stockList);
      if (stockList.length > 0) {
        setSelectedStock(stockList[0].symbol);
      }
      // Execute initial prediction on default stock
      const initPred = await apiClient.predictRisk({
        stock_symbol: stockList[0]?.symbol || 'RELIANCE.NS',
        model_name: 'Random Forest',
      });
      setPrediction(initPred);
      if (initPred.features_used) {
        setCustomFeatures(initPred.features_used);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize prediction service.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        stock_symbol: selectedStock,
        model_name: selectedModel,
      };

      if (predictionMode === 'custom') {
        payload.custom_features = customFeatures;
        payload.as_of_date = 'Custom User Indicators';
      }

      const res = await apiClient.predictRisk(payload);
      setPrediction(res);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Prediction request failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!prediction) return;
    try {
      const blob = await apiClient.exportPredictionCsv({
        stock_symbol: prediction.stock_symbol,
        model_name: prediction.model_name,
        custom_features: prediction.features_used,
        as_of_date: prediction.as_of_date,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `investiq_${prediction.stock_symbol}_prediction.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download CSV:', err);
    }
  };

  const handleFeatureChange = (key: string, val: string) => {
    const num = parseFloat(val);
    setCustomFeatures((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  if (initialLoading) {
    return (
      <div className="p-8">
        <LoadingState message="Initializing Risk Prediction Engine..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Risk Prediction"
        description="Forward 20-trading-day volatility risk classification using verified trained estimators."
        latestDate={prediction?.as_of_date}
        modelStatus="Random Forest Active"
      />

      <div className="px-8 space-y-6">
        {/* Main Grid: Control Panel (Left) & Results Display (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-surface-border">
                <Sliders className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-content-primary">Prediction Configuration</h2>
              </div>

              {/* Equities Selector */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                  Select Equity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {stocks.map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => setSelectedStock(s.symbol)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        selectedStock === s.symbol
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-surface-border hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-content-primary">
                        {s.symbol.replace('.NS', '')}
                      </div>
                      <div className="text-[10px] text-content-secondary truncate mt-0.5">
                        {s.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                  Classifier Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('Random Forest')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedModel === 'Random Forest'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-surface-border hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-content-primary">Random Forest</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1">
                      Production Selected
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModel('XGBoost')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedModel === 'XGBoost'
                        ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400'
                        : 'border-surface-border hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-content-primary">XGBoost</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium mt-1">
                      Diagnostic Mode
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                  Input Source
                </label>
                <div className="flex rounded-lg border border-surface-border p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setPredictionMode('market')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      predictionMode === 'market'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    Latest Historical Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setPredictionMode('custom')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      predictionMode === 'custom'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    Custom Indicators
                  </button>
                </div>
              </div>

              {/* Custom Feature Inputs (Only when custom mode is selected) */}
              {predictionMode === 'custom' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-content-secondary">
                    Fine-tune technical indicator values to simulate hypothetical market volatility regimes:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(customFeatures).map(([feat, val]) => (
                      <div key={feat} className="space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-600 truncate">
                          {feat}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => handleFeatureChange(feat, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-surface-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handlePredict}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-md shadow-primary/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Evaluating Features...</span>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Risk Prediction</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Prediction Alert</span>
                </div>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* Results Display Column */}
          <div className="lg:col-span-7 space-y-5">
            {prediction ? (
              <>
                {/* Result Hero Card */}
                <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-surface-border gap-3">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-content-secondary">
                        Inference Result
                      </span>
                      <h3 className="text-xl font-bold text-content-primary mt-0.5">
                        {prediction.stock_symbol} Risk Assessment
                      </h3>
                      <p className="text-xs text-content-secondary">
                        Model: <strong>{prediction.model_name}</strong> • Horizon: <strong>{prediction.prediction_horizon}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RiskBadge level={prediction.predicted_label} size="lg" />
                    </div>
                  </div>

                  {/* Probability Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-3">
                      Calibrated Class Probabilities
                    </h4>
                    <ProbabilityChart
                      probabilities={prediction.probabilities}
                      predictedLabel={prediction.predicted_label}
                    />
                  </div>

                  {/* Contextual Explanation */}
                  <div className="p-4 rounded-lg bg-surface-bg border border-surface-border space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-content-primary">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Quantitative Interpretation</span>
                    </div>
                    <p className="text-xs text-content-secondary leading-relaxed">
                      {prediction.explanation}
                    </p>
                  </div>

                  {/* Download Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleDownloadCsv}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-surface-border rounded-lg text-xs font-semibold text-content-primary hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      <span>Download Prediction CSV</span>
                    </button>
                  </div>
                </div>

                {/* Features Used Table */}
                <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                        Feature Vector (Inputs Used by Estimator)
                      </h4>
                      <p className="text-[11px] text-content-secondary">
                        8 verified past-only indicators ordered strictly according to feature schema.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Date: {prediction.as_of_date}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {Object.entries(prediction.features_used).map(([feat, val]) => (
                      <div key={feat} className="p-2.5 rounded-lg border border-slate-100 bg-surface-hover/30">
                        <span className="text-[10px] font-semibold text-slate-500 truncate block">
                          {feat}
                        </span>
                        <span className="text-xs font-bold font-mono text-content-primary mt-0.5 block">
                          {formatNumber(val, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-surface-border p-12 text-center shadow-card">
                <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-content-primary">No Active Prediction</h3>
                <p className="text-xs text-content-secondary mt-1 max-w-sm mx-auto">
                  Select an equity and click "Run Risk Prediction" to view the model's calibrated risk classification.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
