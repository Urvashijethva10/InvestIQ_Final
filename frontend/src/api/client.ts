import axios from 'axios';
import {
  DashboardSummary,
  PredictionResult,
  ValidationResult,
  ModelMetric,
  ConfusionMatrixData,
  FeatureImportanceItem,
  HistoricalRecord,
  StockInfo,
} from '../types';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000,
});

export const apiClient = {
  // Health
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  getStockTrends: async (
    symbols?: string[],
    startDate?: string,
    endDate?: string,
    normalize = true
  ) => {
    const params = new URLSearchParams();
    if (symbols && symbols.length > 0) {
      symbols.forEach((s) => params.append('symbols', s));
    }
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('normalize', String(normalize));

    const res = await api.get(`/dashboard/stock-trends?${params.toString()}`);
    return res.data;
  },

  // Predictions
  predictRisk: async (payload: {
    stock_symbol: string;
    model_name?: string;
    custom_features?: Record<string, number>;
    as_of_date?: string;
  }): Promise<PredictionResult> => {
    const res = await api.post<PredictionResult>('/predictions/predict', payload);
    return res.data;
  },

  exportPredictionCsv: async (payload: {
    stock_symbol: string;
    model_name?: string;
    custom_features?: Record<string, number>;
    as_of_date?: string;
  }) => {
    const res = await api.post('/predictions/export-csv', payload, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Uploads
  validateCsvUpload: async (file: File): Promise<ValidationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ValidationResult>('/uploads/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  predictFromUpload: async (
    file: File,
    modelName = 'Random Forest',
    targetTicker = 'USER_STOCK'
  ): Promise<{ validation: any; prediction: PredictionResult }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);
    formData.append('target_ticker', targetTicker);
    const res = await api.post('/uploads/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getSampleTemplateUrl: () => '/api/uploads/sample-template',

  // Performance
  getModelMetrics: async (): Promise<ModelMetric[]> => {
    const res = await api.get<ModelMetric[]>('/performance/metrics');
    return res.data;
  },

  getConfusionMatrix: async (model = 'Random Forest'): Promise<ConfusionMatrixData> => {
    const res = await api.get<ConfusionMatrixData>(`/performance/confusion-matrix?model=${encodeURIComponent(model)}`);
    return res.data;
  },

  getFeatureImportance: async (): Promise<FeatureImportanceItem[]> => {
    const res = await api.get<FeatureImportanceItem[]>('/performance/feature-importance');
    return res.data;
  },

  getEvaluationReport: async (): Promise<any> => {
    const res = await api.get('/performance/report');
    return res.data;
  },

  downloadModelComparisonUrl: () => '/api/performance/download-comparison',
  downloadEvaluationReportUrl: () => '/api/performance/download-report',
  getChartUrl: (type: 'confusion-matrix' | 'feature-importance') => `/api/performance/chart/${type}`,

  // Explorer
  getSupportedStocks: async (): Promise<StockInfo[]> => {
    const res = await api.get<StockInfo[]>('/data/stocks');
    return res.data;
  },

  getStockHistory: async (
    symbol: string,
    startDate?: string,
    endDate?: string,
    normalize = false
  ): Promise<{ symbol: string; count: number; records: HistoricalRecord[] }> => {
    const params = new URLSearchParams({ symbol, normalize: String(normalize) });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await api.get(`/data/history?${params.toString()}`);
    return res.data;
  },

  exportHistoryUrl: (symbol: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ symbol });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return `/api/data/export?${params.toString()}`;
  },
};
