import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Award,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  FileText,
  Sliders,
  Image,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ModelMetric, ConfusionMatrixData, FeatureImportanceItem } from '../types';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { formatPercent } from '../utils/formatting';

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrixData | null>(null);
  const [featureImportances, setFeatureImportances] = useState<FeatureImportanceItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<'Random Forest' | 'XGBoost' | 'Compare Both'>('Compare Both');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mList, cm, fi] = await Promise.all([
        apiClient.getModelMetrics(),
        apiClient.getConfusionMatrix('Random Forest'),
        apiClient.getFeatureImportance(),
      ]);
      setMetrics(mList);
      setConfusionMatrix(cm);
      setFeatureImportances(fi);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch evaluation performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  const currentMetric = React.useMemo(() => {
    if (selectedModel === 'XGBoost') {
      return metrics.find((m) => m.model === 'XGBoost') || metrics[0];
    }
    return metrics.find((m) => m.model === 'Random Forest') || metrics[0];
  }, [metrics, selectedModel]);

  if (loading) {
    return (
      <div className="p-8">
        <LoadingState message="Loading Model Evaluation Metrics & Confusion Matrices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorState
          title="Performance Data Unavailable"
          message={error}
          onRetry={fetchPerformanceData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Model Performance & Evaluation"
        description="Empirical held-out test evaluation comparing Random Forest and XGBoost with chronological separation."
        modelStatus="Random Forest Selected (48.52% F1)"
      />

      <div className="px-8 space-y-6">
        {/* Model Selector Bar & Download Controls */}
        <div className="bg-white rounded-xl border border-surface-border p-4 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
              Evaluation View:
            </span>
            <div className="inline-flex rounded-lg border border-surface-border p-0.5 bg-slate-50 text-xs">
              {(['Compare Both', 'Random Forest', 'XGBoost'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                    selectedModel === m
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={apiClient.downloadModelComparisonUrl()}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-surface-border bg-white text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-slate-50 shadow-sm"
              download
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Metrics CSV</span>
            </a>
            <a
              href={apiClient.downloadEvaluationReportUrl()}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-surface-border bg-white text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-slate-50 shadow-sm"
              download
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Report JSON</span>
            </a>
          </div>
        </div>

        {/* 4 Metric Cards for Selected Model */}
        {currentMetric && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={`${selectedModel === 'Compare Both' ? 'Random Forest' : selectedModel} Accuracy`}
              value={formatPercent(currentMetric.accuracy, 2)}
              subtitle="Held-out chronological test set"
              icon={Award}
              badge="Genuine Holdout"
              badgeType="success"
            />
            <MetricCard
              title="Weighted F1-Score"
              value={formatPercent(currentMetric.weighted_f1, 2)}
              subtitle="Primary model selection metric"
              icon={BarChart3}
              badge="Top Generalizer"
              badgeType="info"
            />
            <MetricCard
              title="Balanced Accuracy"
              value={formatPercent(currentMetric.balanced_accuracy, 2)}
              subtitle="Macro average across 3 risk tiers"
              icon={Sliders}
              badge="Unbiased"
              badgeType="neutral"
            />
            <MetricCard
              title="Macro F1-Score"
              value={formatPercent(currentMetric.macro_f1, 2)}
              subtitle="Equal class weighting"
              icon={Layers}
              badge="Regime Robust"
              badgeType="neutral"
            />
          </div>
        )}

        {/* Model Comparison Table */}
        <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-content-primary">
                Model Comparison: Random Forest vs. XGBoost
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Evaluated on 2,104 chronological held-out test observations with a 20-trading-day purge gap.
              </p>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-mono px-2.5 py-1 rounded-full border border-slate-200">
              Source: model_metrics.csv
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 border-b border-surface-border text-content-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Model Architecture</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                  <th className="py-3 px-4 text-right">Balanced Acc.</th>
                  <th className="py-3 px-4 text-right">Weighted Precision</th>
                  <th className="py-3 px-4 text-right">Weighted Recall</th>
                  <th className="py-3 px-4 text-right">Weighted F1</th>
                  <th className="py-3 px-4 text-right">Macro F1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {metrics.map((row) => {
                  const isRf = row.model === 'Random Forest';
                  return (
                    <tr
                      key={row.model}
                      className={isRf ? 'bg-emerald-50/20 font-medium' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3.5 px-4 font-bold text-content-primary flex items-center space-x-2">
                        <span>{row.model}</span>
                        {isRf && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            WINNER
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isRf
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isRf ? 'Active' : 'Preserved'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-content-primary">
                        {formatPercent(row.accuracy, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-content-secondary">
                        {formatPercent(row.balanced_accuracy, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-content-secondary">
                        {formatPercent(row.weighted_precision, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-content-secondary">
                        {formatPercent(row.weighted_recall, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">
                        {formatPercent(row.weighted_f1, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-content-secondary">
                        {formatPercent(row.macro_f1, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confusion Matrix & Feature Importance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Confusion Matrix (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Random Forest Test Confusion Matrix
                </h3>
                <p className="text-[11px] text-content-secondary mt-0.5">
                  Actual vs. Predicted class counts across 2,104 chronological test observations.
                </p>
              </div>
              <a
                href={apiClient.getChartUrl('confusion-matrix')}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1"
              >
                <Image className="w-3.5 h-3.5" />
                <span>PNG Chart</span>
              </a>
            </div>

            {confusionMatrix && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Header Row */}
                  <div className="font-semibold text-content-secondary text-[11px] flex items-center justify-center bg-slate-50 rounded">
                    Actual \ Pred
                  </div>
                  {confusionMatrix.labels.map((lbl) => (
                    <div key={lbl} className="p-2 bg-slate-100/70 rounded font-bold text-content-primary text-[11px]">
                      {lbl}
                    </div>
                  ))}

                  {/* Rows */}
                  {confusionMatrix.matrix.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                      <div className="p-2.5 bg-slate-100/70 rounded font-bold text-content-primary text-[11px] flex items-center justify-center">
                        {confusionMatrix.labels[rIdx]}
                      </div>
                      {row.map((cell, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        return (
                          <div
                            key={cIdx}
                            className={`p-3.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                              isDiag
                                ? 'bg-primary/10 border border-primary/30 text-primary font-bold'
                                : 'bg-slate-50 border border-slate-100 text-content-secondary'
                            }`}
                          >
                            <span className="text-base font-bold font-mono">{cell}</span>
                            <span className="text-[10px] opacity-75">
                              {((cell / confusionMatrix.total_samples) * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                <div className="p-3 bg-surface-bg border border-surface-border rounded-lg flex items-center justify-between text-xs text-content-secondary">
                  <span>
                    Total Test Observations: <strong>{confusionMatrix.total_samples.toLocaleString()}</strong>
                  </span>
                  <span>
                    Diagonal Correct: <strong>{confusionMatrix.correct_predictions.toLocaleString()}</strong> ({formatPercent(confusionMatrix.accuracy, 2)})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Feature Importance (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Feature Importance (Random Forest)
                </h3>
                <p className="text-[11px] text-content-secondary mt-0.5">
                  Gini impurity contribution of each indicator.
                </p>
              </div>
              <a
                href={apiClient.getChartUrl('feature-importance')}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1"
              >
                <Image className="w-3.5 h-3.5" />
                <span>PNG Chart</span>
              </a>
            </div>

            <div className="space-y-3 pt-2">
              {featureImportances.map((item, idx) => {
                const maxVal = featureImportances[0]?.importance || 0.25;
                const pct = (item.importance / maxVal) * 100;
                return (
                  <div key={item.feature} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-content-primary">{item.feature}</span>
                      <span className="font-mono text-slate-500 font-bold">{item.importance.toFixed(4)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-primary' : 'bg-primary/70'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Academic Rigor Notice Card */}
        <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start space-x-3 text-xs text-blue-900 leading-relaxed shadow-sm">
          <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-blue-950">Academic Integrity & Realistic Financial Machine Learning</h4>
            <p>
              Stock price volatility is inherently noisy, non-stationary, and subject to macroeconomic regime shifts.
              Claims of 80%+ accuracy for 3-class future volatility prediction are statistically unrealistic and indicative
              of data leakage. InvestIQ uses an authentic chronological split with a 20-trading-day purge gap to prevent lookahead bias.
              The ~48.81% held-out accuracy represents a genuine mathematical baseline suitable for academic research.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
