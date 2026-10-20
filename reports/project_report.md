# InvestIQ — Comprehensive Project & Evaluation Report

**Project Name:** InvestIQ  
**Subtitle:** Investment Risk Intelligence  
**Tagline:** *Smarter Insights. Better Investments.*  
**Date:** October 2026  
**Status:** Complete Full-Stack Implementation & Production Verification  

---

## 1. Executive Summary

InvestIQ is a full-stack, machine-learning-driven equity volatility and investment risk intelligence web platform. The system is designed to forecast forward 20-trading-day volatility regimes (categorized into **Low Risk**, **Medium Risk**, and **High Risk**) for Indian blue-chip equities listed on the National Stock Exchange (NSE):
- **Reliance Industries Ltd** (`RELIANCE.NS`)
- **Tata Consultancy Services Ltd** (`TCS.NS`)
- **Infosys Ltd** (`INFY.NS`)
- **HDFC Bank Ltd** (`HDFCBANK.NS`)

The application replaces simplistic proof-of-concept scripts with a modular architecture:
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide icons, React Router
- **Backend:** FastAPI, Python 3.14, Uvicorn, Pandas, NumPy, Scikit-learn, XGBoost, Joblib, Pydantic
- **Data & Evaluation:** Processed time series (10,508 records), chronological holdouts with 20-day purge gaps, verified confusion matrices, feature importance graphs, and automated testing suites.

---

## 2. Verification of Existing Artifacts and Provenance

All files from the previous model development were inspected and verified:

| File | Status | Verification Findings |
|---|---|---|
| `artifacts/feature_columns.json` | **Verified** | Contains exactly 8 features: `Daily_Return`, `Return_5D`, `Volatility_20`, `RSI_14`, `Price_MA5_Ratio`, `Price_MA20_Ratio`, `Return_20D`, `Volatility_5`. |
| `artifacts/risk_thresholds.json` | **Verified** | Quantile cuts: Low/Med threshold = `0.011477`, Med/High threshold = `0.015208`. Class mapping: `0: Low Risk`, `1: Medium Risk`, `2: High Risk`. Selected model: `Random Forest`. |
| `artifacts/random_forest.joblib` | **Verified & Active** | Loads cleanly. `n_features_in_ = 8`, `classes_ = [0, 1, 2]`. Fitted with 400 estimators, max depth 12, balanced subsample weights. Produces full probability distributions. |
| `artifacts/xgboost.joblib` | **Preserved (Compatibility Diagnostic)** | Saved from Google Colab using earlier XGBoost format. In Python 3.14 with installed XGBoost 3.4.1, UBJSON parser rejects legacy null object definitions (`Invalid cast, from Null to Object`). As instructed, the model file is preserved unchanged in `artifacts/`, accurately reported in the UI, and reproducible via `backend/ml/pipeline.py`. |
| `data/processed/model_data.csv` | **Verified** | 10,508 usable records spanning February 1, 2016 through September 18, 2026 across all 4 stocks. |
| `data/processed/model_metrics.csv` | **Verified** | Contains exact historical evaluation metrics for Random Forest and XGBoost. |

---

## 3. Empirical Model Evaluation & Comparison

In accordance with rigorous financial time-series standards:
1. **Chronological Holdout:** The dataset was partitioned by date using an 80% split position.
2. **20-Trading-Day Purge Gap:** A 20-trading-day buffer between training and testing was enforced to eliminate target-overlap leakage (since the target is the forward 20-day standard deviation).
3. **Training-Period-Only Cutoffs:** Quantile cutoffs were calculated solely on the training partition.

### Evaluation Comparison Table

| Metric | Random Forest (Selected Model) | XGBoost Classifier | Methodology |
|---|---|---|---|
| **Accuracy** | **48.81%** | 47.29% | Unseen chronological test set |
| **Balanced Accuracy** | **48.63%** | 47.06% | Macro average across 3 tiers |
| **Weighted Precision** | **48.37%** | 46.65% | Weighted by class support |
| **Weighted Recall** | **48.81%** | 47.29% | Weighted recall |
| **Weighted F1-Score** | **48.52%** | 46.86% | **Selection tie-breaker metric** |
| **Macro F1-Score** | **48.38%** | 46.68% | Unweighted harmonic mean |

*Note on Accuracy:* Stock market returns are notoriously noisy and subject to regime shifts. Claims of 80%+ accuracy for 3-class future volatility prediction are statistically fabricated or result from future lookahead leakage. A 48.81% test accuracy across 3 balanced regimes represents a mathematically verified baseline.

### Random Forest Test Confusion Matrix (2,104 Held-Out Records)

| Actual Risk Tier \ Predicted | Predicted Low Risk | Predicted Medium Risk | Predicted High Risk | Total Actual |
|---|---|---|---|---|
| **Actual Low Risk (0)** | **397** | 192 | 134 | 723 |
| **Actual Medium Risk (1)** | 239 | **242** | 201 | 682 |
| **Actual High Risk (2)** | 141 | 170 | **388** | 699 |
| **Total Predicted** | 777 | 604 | 723 | **2,104** |

---

## 4. Feature Importance Architecture

Gini impurity contributions from the verified Random Forest estimator:

1. **`Volatility_20` (0.2285):** 20-day historical standard deviation of daily returns (primary predictor of future regime persistency).
2. **`Volatility_5` (0.1741):** 5-day short-term volatility (captures immediate shocks).
3. **`RSI_14` (0.1412):** 14-day Relative Strength Index (captures overbought/oversold dispersion).
4. **`Price_MA20_Ratio` (0.1194):** Ratio of current close to 20-day moving average.
5. **`Return_20D` (0.1086):** 20-day cumulative price momentum.
6. **`Price_MA5_Ratio` (0.0821):** 5-day short-term moving average ratio.
7. **`Return_5D` (0.0763):** 5-day momentum.
8. **`Daily_Return` (0.0698):** 1-day percentage price change.

---

## 5. System Architecture & Components

```
InvestIQ Architecture
├── Frontend (React 18 / Vite / TypeScript / Tailwind CSS)
│   ├── Overview Dashboard (trends, workflow, model status, quick access)
│   ├── Risk Prediction (interactive stock & custom indicator inference)
│   ├── Upload Your Data (CSV validation, sanitization, feature generation)
│   ├── Model Performance (metrics comparison, confusion matrix, feature bars)
│   └── Data Explorer (price charts, technical indicators stream, tabular download)
│
└── Backend (FastAPI / Uvicorn / Scikit-learn / Pandas)
    ├── /api/health (service health & artifact status)
    ├── /api/dashboard (summary statistics & aligned multi-stock trends)
    ├── /api/predictions (probability distribution inference & CSV export)
    ├── /api/uploads (CSV sanitization, preview, and prediction)
    ├── /api/performance (metrics, confusion matrix, feature importances, charts)
    └── /api/data (supported stocks, historical queries, filtered CSV export)
```

---

## 6. Verification and Testing Outcomes

Automated testing was conducted via pytest:
- **Total Tests:** 19
- **Passed:** 19
- **Failed:** 0
- **Suites Covered:**
  - `test_health.py`: Root API response, health diagnostics, status indicators
  - `test_artifacts.py`: Schema loading, 8 features verification, class mapping `[0: Low, 1: Medium, 2: High]`
  - `test_features.py`: Exact mathematical formula replication, zero-loss edge cases, history length validation
  - `test_predictions.py`: Valid stock inference, custom feature vector inference, invalid model handling
  - `test_uploads.py`: CSV validation, insufficient rows rejection, non-CSV rejection, sample template download
  - `test_metrics.py`: Metrics table accuracy, confusion matrix shape, feature importances ranking

---

## 7. Financial & Safety Disclaimers

1. **Academic Use Only:** InvestIQ is built for quantitative educational and academic research purposes. It does not provide personalized investment advice or financial planning.
2. **No Guaranteed Returns:** Model predictions evaluate historical statistical dispersion and should not be construed as performance guarantees.
3. **Data Integrity:** No synthetic values were fabricated for live metrics. All evaluation statistics stem directly from genuine holdout calculations.
