"""
Paths configuration for InvestIQ backend.
All paths are securely anchored to the project workspace root.
"""

from pathlib import Path

# Workspace root is two levels up from this file (backend/core/paths.py -> InvestIQ_Final)
WORKSPACE_DIR = Path(__file__).resolve().parent.parent.parent

ARTIFACTS_DIR = WORKSPACE_DIR / "artifacts"
DATA_DIR = WORKSPACE_DIR / "data"
DATA_RAW_DIR = DATA_DIR / "raw"
DATA_PROCESSED_DIR = DATA_DIR / "processed"
DATA_UPLOADS_DIR = DATA_DIR / "uploads"
OUTPUTS_DIR = WORKSPACE_DIR / "outputs"
REPORTS_DIR = WORKSPACE_DIR / "reports"
SCRIPTS_DIR = WORKSPACE_DIR / "scripts"

# Specific artifact files
RANDOM_FOREST_MODEL_PATH = ARTIFACTS_DIR / "random_forest.joblib"
XGBOOST_MODEL_PATH = ARTIFACTS_DIR / "xgboost.joblib"
FEATURE_COLUMNS_PATH = ARTIFACTS_DIR / "feature_columns.json"
RISK_THRESHOLDS_PATH = ARTIFACTS_DIR / "risk_thresholds.json"

# Processed and output data files
MODEL_DATA_PATH = DATA_PROCESSED_DIR / "model_data.csv"
MODEL_METRICS_PATH = DATA_PROCESSED_DIR / "model_metrics.csv"
RAW_STOCK_DATA_PATH = DATA_RAW_DIR / "stock_data.csv"

OUTPUT_METRICS_PATH = OUTPUTS_DIR / "model_metrics.csv"
OUTPUT_COMPARISON_PATH = OUTPUTS_DIR / "model_comparison.csv"
OUTPUT_CONFUSION_MATRIX_PATH = OUTPUTS_DIR / "confusion_matrix.png"
OUTPUT_FEATURE_IMPORTANCE_PATH = OUTPUTS_DIR / "feature_importance.png"
OUTPUT_EVALUATION_REPORT_PATH = OUTPUTS_DIR / "evaluation_report.json"

# Ensure runtime directories exist
DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
DATA_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
