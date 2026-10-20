"""
Complete ML Retraining Pipeline for InvestIQ.
Executes data preprocessing, feature engineering, chronological train/test split,
quantile thresholding, model training, evaluation, and safe artifact export.
"""

import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from backend.ml.train import train_models
from backend.ml.evaluate import evaluate_models
from backend.core.paths import (
    DATA_RAW_DIR,
    DATA_PROCESSED_DIR,
    ARTIFACTS_DIR,
    WORKSPACE_DIR
)

FEATURES = [
    "Daily_Return", "Return_5D", "Volatility_20", "RSI_14",
    "Price_MA5_Ratio", "Price_MA20_Ratio", "Return_20D", "Volatility_5"
]

def make_features(g: pd.DataFrame) -> pd.DataFrame:
    g = g.sort_values("Date").copy()
    c = g["Close"].astype(float)
    r = c.pct_change()
    g["Daily_Return"] = r
    g["Return_5D"] = c.pct_change(5)
    g["Volatility_20"] = r.rolling(20).std()

    delta = c.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    g["RSI_14"] = 100 - 100 / (1 + rs)

    g["Price_MA5_Ratio"] = c / c.rolling(5).mean()
    g["Price_MA20_Ratio"] = c / c.rolling(20).mean()
    g["Return_20D"] = c.pct_change(20)
    g["Volatility_5"] = r.rolling(5).std()

    # Forward-looking 20-day volatility target (returns from t+1 to t+20)
    g["Future_Volatility_20"] = r.shift(-1).iloc[::-1].rolling(20, min_periods=20).std().iloc[::-1]
    return g

def run_pipeline(activate: bool = False, confirm: bool = False):
    print("=" * 60)
    print("InvestIQ ML Training Pipeline")
    print("=" * 60)

    # 1. Source Data
    raw_path = DATA_RAW_DIR / "stock_data.csv"
    processed_path = DATA_PROCESSED_DIR / "model_data.csv"

    if raw_path.exists():
        print(f"Loading raw market data from {raw_path}...")
        prices = pd.read_csv(raw_path)
    elif processed_path.exists():
        print(f"Raw data not found. Using processed data from {processed_path}...")
        prices = pd.read_csv(processed_path)[["Date", "Stock", "Close"]]
    else:
        raise FileNotFoundError("Neither raw/stock_data.csv nor processed/model_data.csv found. Run scripts/download_market_data.py first.")

    prices["Date"] = pd.to_datetime(prices["Date"], errors="coerce")
    prices = prices.dropna(subset=["Date", "Stock", "Close"]).drop_duplicates(["Date", "Stock"]).sort_values(["Stock", "Date"])
    print(f"Loaded {len(prices)} price observations across {prices['Stock'].nunique()} stocks.")

    # 2. Feature Engineering
    print("Computing features and forward-looking volatility targets...")
    featured = pd.concat([make_features(g) for _, g in prices.groupby("Stock")], ignore_index=True)
    featured = featured.replace([np.inf, -np.inf], np.nan)
    model_df = featured.dropna(subset=FEATURES + ["Future_Volatility_20"]).sort_values(["Date", "Stock"]).reset_index(drop=True)
    print(f"Usable model records: {len(model_df)}")

    # 3. Chronological Split (80% holdout with 20-date gap)
    dates = np.array(sorted(model_df["Date"].unique()))
    split_pos = int(len(dates) * 0.80)
    if len(dates) < 100 or split_pos <= 20:
        raise ValueError("Insufficient dates to create a chronological split.")

    test_start = pd.Timestamp(dates[split_pos])
    gap_start = pd.Timestamp(dates[max(0, split_pos - 20)])

    train = model_df[model_df["Date"] < gap_start].copy()
    test = model_df[model_df["Date"] >= test_start].copy()

    # 4. Quantile Thresholds (Learned strictly on training set)
    q_low, q_high = train["Future_Volatility_20"].quantile([1/3, 2/3]).tolist()
    print(f"Training risk thresholds -> Low/Med: {q_low:.6f}, Med/High: {q_high:.6f}")

    def assign_risk_label(v):
        return np.select([v <= q_low, v <= q_high], [0, 1], default=2).astype(int)

    train["Risk_Label"] = assign_risk_label(train["Future_Volatility_20"])
    test["Risk_Label"] = assign_risk_label(test["Future_Volatility_20"])

    X_train = train[FEATURES].astype(float)
    y_train = train["Risk_Label"].astype(int)
    X_test = test[FEATURES].astype(float)
    y_test = test["Risk_Label"].astype(int)

    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")
    print(f"Train class distribution:\n{y_train.value_counts().sort_index().to_dict()}")
    print(f"Test class distribution:\n{y_test.value_counts().sort_index().to_dict()}")

    # 5. Train Models
    rf_model, xgb_model = train_models(X_train, y_train)

    # 6. Evaluate Models
    print("Evaluating models on held-out test data...")
    results_df, best_name, best_model = evaluate_models(rf_model, xgb_model, X_test, y_test)
    print("\nModel Evaluation Results:")
    print(results_df.to_string(index=False))
    print(f"\nWinning Model: {best_name} (Held-out Accuracy: {results_df.loc[0, 'Accuracy']:.2%})")

    # 7. Safe Export
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_dir = ARTIFACTS_DIR if (activate and confirm) else (WORKSPACE_DIR / f"artifacts_retrained_{timestamp}")
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nExporting retrained artifacts to: {target_dir}")
    joblib.dump(rf_model, target_dir / "random_forest.joblib")
    joblib.dump(xgb_model, target_dir / "xgboost.joblib")

    with open(target_dir / "feature_columns.json", "w", encoding="utf-8") as f:
        json.dump(FEATURES, f, indent=2)

    threshold_data = {
        "low_medium_threshold": float(q_low),
        "medium_high_threshold": float(q_high),
        "class_mapping": {"0": "Low Risk", "1": "Medium Risk", "2": "High Risk"},
        "selected_model": best_name,
        "target": "standard deviation of next 20 daily returns",
        "retrained_timestamp": timestamp,
    }
    with open(target_dir / "risk_thresholds.json", "w", encoding="utf-8") as f:
        json.dump(threshold_data, f, indent=2)

    results_df.to_csv(target_dir / "model_metrics.csv", index=False)
    print("[SUCCESS] Pipeline completed successfully.")
    if not (activate and confirm):
        print("\nNote: Existing production artifacts in artifacts/ were NOT modified.")
        print(f"To activate these new models in production, run:")
        print(f"  py -m backend.ml.pipeline --activate --confirm")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="InvestIQ ML Retraining Pipeline")
    parser.add_argument("--activate", action="store_true", help="Replace active production artifacts.")
    parser.add_argument("--confirm", action="store_true", help="Confirmation flag required to overwrite production artifacts.")
    args = parser.parse_args()
    run_pipeline(activate=args.activate, confirm=args.confirm)
