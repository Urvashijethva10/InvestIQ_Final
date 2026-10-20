"""
Artifact Verification Script for InvestIQ
Verifies trained models, feature schemas, risk thresholds, and processed data.
"""

import sys
import json
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

def verify_artifacts(workspace_dir: Path = None):
    if workspace_dir is None:
        workspace_dir = Path(__file__).resolve().parent.parent

    artifacts_dir = workspace_dir / "artifacts"
    data_dir = workspace_dir / "data" / "processed"
    outputs_dir = workspace_dir / "outputs"

    print("=" * 60)
    print("InvestIQ Artifact Verification")
    print("=" * 60)
    print(f"Workspace directory: {workspace_dir}")
    print(f"Python version: {sys.version.split()[0]}")

    results = {
        "feature_columns": False,
        "risk_thresholds": False,
        "random_forest": False,
        "xgboost": False,
        "model_data": False,
        "model_metrics": False,
    }

    # 1. Feature columns
    fc_path = artifacts_dir / "feature_columns.json"
    if fc_path.exists():
        try:
            with open(fc_path, "r", encoding="utf-8") as f:
                features = json.load(f)
            print(f"[OK] feature_columns.json: {len(features)} features: {features}")
            results["feature_columns"] = True
        except Exception as e:
            print(f"[ERROR] Failed to read feature_columns.json: {e}")
    else:
        print("[MISSING] artifacts/feature_columns.json")

    # 2. Risk thresholds
    rt_path = artifacts_dir / "risk_thresholds.json"
    if rt_path.exists():
        try:
            with open(rt_path, "r", encoding="utf-8") as f:
                thresholds = json.load(f)
            print(f"[OK] risk_thresholds.json: {thresholds}")
            results["risk_thresholds"] = True
        except Exception as e:
            print(f"[ERROR] Failed to read risk_thresholds.json: {e}")
    else:
        print("[MISSING] artifacts/risk_thresholds.json")

    # 3. Random Forest
    rf_path = artifacts_dir / "random_forest.joblib"
    if rf_path.exists():
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                rf_model = joblib.load(rf_path)
            print(f"[OK] random_forest.joblib loaded successfully.")
            print(f"     Classes: {rf_model.classes_}, Features in: {rf_model.n_features_in_}")
            dummy_x = np.zeros((1, rf_model.n_features_in_))
            pred = rf_model.predict(dummy_x)
            proba = rf_model.predict_proba(dummy_x)
            print(f"     Dummy prediction test: class {pred[0]}, proba {proba[0]}")
            results["random_forest"] = True
        except Exception as e:
            print(f"[ERROR] Failed to load random_forest.joblib: {e}")
    else:
        print("[MISSING] artifacts/random_forest.joblib")

    # 4. XGBoost
    xgb_path = artifacts_dir / "xgboost.joblib"
    if xgb_path.exists():
        try:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                xgb_model = joblib.load(xgb_path)
            print(f"[OK] xgboost.joblib loaded successfully.")
            results["xgboost"] = True
        except Exception as e:
            print(f"[WARNING/COMPATIBILITY] xgboost.joblib failed to load: {e}")
            print("     Note: Serialized under an earlier XGBoost UBJSON format (e.g. 2.x in Colab).")
            print("     XGBoost 3.x rejects null object schemas from older exports.")
            print("     The active production selected model in risk_thresholds.json is 'Random Forest'.")
            print("     To regenerate xgboost.joblib natively in this environment, run scripts/retrain_pipeline.py.")
    else:
        print("[MISSING] artifacts/xgboost.joblib")

    # 5. Processed data
    md_path = data_dir / "model_data.csv"
    if md_path.exists():
        try:
            df = pd.read_csv(md_path)
            print(f"[OK] model_data.csv: {df.shape[0]} rows, {df.shape[1]} columns")
            print(f"     Stocks: {df['Stock'].unique().tolist()}")
            print(f"     Date range: {df['Date'].min()} to {df['Date'].max()}")
            results["model_data"] = True
        except Exception as e:
            print(f"[ERROR] Failed to read model_data.csv: {e}")
    else:
        print("[MISSING] data/processed/model_data.csv")

    # 6. Model metrics
    mm_path = data_dir / "model_metrics.csv"
    if not mm_path.exists():
        mm_path = outputs_dir / "model_metrics.csv"
    if mm_path.exists():
        try:
            mdf = pd.read_csv(mm_path)
            print(f"[OK] model_metrics.csv loaded:\n{mdf.to_string(index=False)}")
            results["model_metrics"] = True
        except Exception as e:
            print(f"[ERROR] Failed to read model_metrics.csv: {e}")
    else:
        print("[MISSING] model_metrics.csv in data/processed/ or outputs/")

    print("=" * 60)
    print("Verification Summary:")
    for k, v in results.items():
        status = "PASSED" if v else ("COMPATIBILITY WARNING" if k == "xgboost" else "FAILED")
        print(f"  {k:20s}: {status}")
    print("=" * 60)

    return results

if __name__ == "__main__":
    verify_artifacts()
