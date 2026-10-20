export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  latest_date: string | null;
  rows: number;
  latest_close: number | null;
}

export interface ModelDetail {
  name: string;
  available: boolean;
  is_selected: boolean;
  error?: string | null;
  feature_count?: number | null;
  classes?: number[] | null;
}

export interface DashboardSummary {
  supported_stocks_count: number;
  available_models_count: number;
  prediction_horizon_days: number;
  latest_valid_date: string | null;
  features_count: number;
  risk_classes_count: number;
  dataset_rows_count: number;
  selected_model: string;
  models_status: Record<string, ModelDetail>;
  supported_stocks: StockInfo[];
  backend_health: 'healthy' | 'degraded' | 'offline';
  risk_classes: string[];
}

export interface PredictionResult {
  stock_symbol: string;
  model_name: string;
  predicted_class: number;
  predicted_label: 'Low Risk' | 'Medium Risk' | 'High Risk' | string;
  risk_color: 'green' | 'amber' | 'red' | string;
  prediction_horizon: string;
  as_of_date: string;
  probabilities: Record<string, number>;
  features_used: Record<string, number>;
  explanation: string;
}

export interface ValidationResult {
  filename: string;
  is_valid: boolean;
  total_rows_parsed: number;
  original_rows: number;
  start_date: string;
  end_date: string;
  tickers_detected: string[];
  columns_detected: string[];
  warnings: string[];
  sample_preview: Record<string, any>[];
  computed_features?: Record<string, number> | null;
  can_predict: boolean;
}

export interface ModelMetric {
  model: string;
  accuracy: number;
  balanced_accuracy: number;
  weighted_precision: number;
  weighted_recall: number;
  weighted_f1: number;
  macro_f1: number;
}

export interface ConfusionMatrixData {
  model: string;
  labels: string[];
  matrix: number[][];
  total_samples: number;
  correct_predictions: number;
  accuracy: number;
  source: string;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface HistoricalRecord {
  date: string;
  close: number;
  normalized_close?: number;
  Daily_Return?: number;
  Return_5D?: number;
  Volatility_20?: number;
  RSI_14?: number;
  Price_MA5_Ratio?: number;
  Price_MA20_Ratio?: number;
  Return_20D?: number;
  Volatility_5?: number;
  Risk_Label?: number;
}
