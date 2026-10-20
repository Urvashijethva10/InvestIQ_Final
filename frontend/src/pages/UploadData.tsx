import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  ShieldAlert,
  ArrowRight,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ValidationResult, PredictionResult } from '../types';
import { Header } from '../components/Header';
import { RiskBadge } from '../components/RiskBadge';
import { ProbabilityChart } from '../components/ProbabilityChart';
import { DataTable } from '../components/DataTable';
import { formatNumber } from '../utils/formatting';

export const UploadData: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('Random Forest');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a valid CSV file (.csv).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setValidationResult(null);
    setPredictionResult(null);
  };

  const handleValidateAndPredict = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError(null);

      // Validate & Predict via backend API
      const res = await apiClient.predictFromUpload(selectedFile, selectedModel);
      setValidationResult(res.validation);
      setPredictionResult(res.prediction);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'File processing failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setPredictionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = apiClient.getSampleTemplateUrl();
  };

  const handleDownloadPredictionCsv = async () => {
    if (!predictionResult) return;
    try {
      const blob = await apiClient.exportPredictionCsv({
        stock_symbol: predictionResult.stock_symbol,
        model_name: predictionResult.model_name,
        custom_features: predictionResult.features_used,
        as_of_date: predictionResult.as_of_date,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `investiq_upload_prediction.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download prediction CSV:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Upload Your Data"
        description="Validate custom CSV equity time series, calculate technical feature vectors, and execute model risk classification."
        modelStatus="Random Forest Active"
      />

      <div className="px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload Box & Guidelines */}
          <div className="lg:col-span-5 space-y-5">
            {/* Upload Box */}
            <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-content-primary">Upload CSV Dataset</h2>
                </div>
                {selectedFile && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear File</span>
                  </button>
                )}
              </div>

              {/* Drag & Drop Target Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-primary/60 bg-surface-bg'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">{selectedFile.name}</p>
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click or drag to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-content-primary">
                        Drag & drop your CSV file here
                      </p>
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        or click to browse your local computer
                      </p>
                    </div>
                    <span className="inline-block text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono mt-2">
                      Max file size: 10 MB
                    </span>
                  </div>
                )}
              </div>

              {/* Model Choice for Prediction */}
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  Classifier for Inference
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-surface-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Random Forest">Random Forest (Selected Production Model)</option>
                  <option value="XGBoost">XGBoost (Diagnostic Holdout)</option>
                </select>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleValidateAndPredict}
                disabled={!selectedFile || loading}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-md shadow-primary/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Validating & Inferring...</span>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Validate & Predict Risk</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Validation Error</span>
                </div>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Data Requirements & Sample Guide */}
            <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-content-primary">CSV File Requirements</h3>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              <div className="text-[11px] text-content-secondary space-y-2">
                <p>
                  <strong className="text-content-primary">Required Columns:</strong>{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">Date</code> and{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-primary">Close</code> (or Price).
                </p>
                <p>
                  <strong className="text-content-primary">Optional Columns:</strong> Open, High, Low, Volume, Stock/Ticker.
                </p>
                <p>
                  <strong className="text-content-primary">Minimum History:</strong> At least <strong>25 trading days</strong> required for rolling 20-day volatility and 14-day RSI.
                </p>
                <p>
                  <strong className="text-content-primary">Quality Checks:</strong> Non-numeric or non-positive prices and duplicate dates are safely removed.
                </p>
                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  Note: Uploading data executes the existing verified model. It does not alter or retrain active production weights.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Prediction Results & Data Preview */}
          <div className="lg:col-span-7 space-y-5">
            {predictionResult && validationResult ? (
              <>
                {/* Prediction Hero Card */}
                <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-surface-border gap-3">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Upload Validation Passed
                      </span>
                      <h3 className="text-xl font-bold text-content-primary mt-1.5">
                        {predictionResult.stock_symbol} Risk Classification
                      </h3>
                      <p className="text-xs text-content-secondary">
                        Date Range: <strong>{validationResult.start_date} to {validationResult.end_date}</strong> ({validationResult.total_rows_parsed} observations)
                      </p>
                    </div>

                    <RiskBadge level={predictionResult.predicted_label} size="lg" />
                  </div>

                  {/* Class Probabilities */}
                  <div>
                    <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-3">
                      Calibrated Volatility Probabilities
                    </h4>
                    <ProbabilityChart
                      probabilities={predictionResult.probabilities}
                      predictedLabel={predictionResult.predicted_label}
                    />
                  </div>

                  {/* Context Explanation */}
                  <div className="p-4 rounded-lg bg-surface-bg border border-surface-border text-xs text-content-secondary leading-relaxed">
                    <strong className="text-content-primary block mb-1">Model Assessment:</strong>
                    {predictionResult.explanation}
                  </div>

                  {/* Warnings if any */}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Preprocessing Sanitizations Applied:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {validationResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleDownloadPredictionCsv}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-surface-border rounded-lg text-xs font-semibold text-content-primary hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      <span>Download Prediction CSV</span>
                    </button>
                  </div>
                </div>

                {/* Latest Computed Features */}
                <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
                  <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-1">
                    Calculated Indicator Profile (Latest Window)
                  </h4>
                  <p className="text-[11px] text-content-secondary mb-3">
                    Technical features computed using the exact formulas from the training pipeline.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.entries(predictionResult.features_used).map(([feat, val]) => (
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
              <div className="bg-white rounded-xl border border-surface-border p-12 text-center shadow-card space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-content-primary">No Dataset Uploaded Yet</h3>
                  <p className="text-xs text-content-secondary mt-1 max-w-sm mx-auto">
                    Upload a CSV file containing date and closing price series on the left to inspect validated records and evaluate risk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-content-primary rounded-lg text-xs font-semibold transition-colors mt-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
