"""
Artifact Service for InvestIQ.
Discovers, loads, caches, and verifies model artifacts and metadata.
"""

import json
import logging
import warnings
from typing import Dict, Any, Optional, List
import joblib

from backend.core.paths import (
    RANDOM_FOREST_MODEL_PATH,
    XGBOOST_MODEL_PATH,
    FEATURE_COLUMNS_PATH,
    RISK_THRESHOLDS_PATH,
)

logger = logging.getLogger("investiq.artifacts")

class ArtifactService:
    _instance: Optional["ArtifactService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ArtifactService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._feature_columns: Optional[List[str]] = None
        self._risk_thresholds: Optional[Dict[str, Any]] = None
        self._rf_model: Any = None
        self._xgb_model: Any = None
        self._rf_error: Optional[str] = None
        self._xgb_error: Optional[str] = None
        self.load_artifacts()
        self._initialized = True

    def load_artifacts(self):
        """Loads all artifacts from disk, catching and logging specific compatibility issues."""
        # 1. Feature columns
        try:
            if FEATURE_COLUMNS_PATH.exists():
                with open(FEATURE_COLUMNS_PATH, "r", encoding="utf-8") as f:
                    self._feature_columns = json.load(f)
            else:
                logger.warning(f"Feature columns not found at {FEATURE_COLUMNS_PATH}")
        except Exception as e:
            logger.error(f"Error loading feature columns: {e}")
            self._feature_columns = None

        # 2. Risk thresholds
        try:
            if RISK_THRESHOLDS_PATH.exists():
                with open(RISK_THRESHOLDS_PATH, "r", encoding="utf-8") as f:
                    self._risk_thresholds = json.load(f)
            else:
                logger.warning(f"Risk thresholds not found at {RISK_THRESHOLDS_PATH}")
        except Exception as e:
            logger.error(f"Error loading risk thresholds: {e}")
            self._risk_thresholds = None

        # 3. Random Forest Model
        try:
            if RANDOM_FOREST_MODEL_PATH.exists():
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    self._rf_model = joblib.load(RANDOM_FOREST_MODEL_PATH)
                self._rf_error = None
                logger.info("Random Forest model loaded successfully.")
            else:
                self._rf_error = f"Model artifact not found at {RANDOM_FOREST_MODEL_PATH}"
        except Exception as e:
            self._rf_model = None
            self._rf_error = f"Failed to load Random Forest model: {str(e)}"
            logger.error(self._rf_error)

        # 4. XGBoost Model
        try:
            if XGBOOST_MODEL_PATH.exists():
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    self._xgb_model = joblib.load(XGBOOST_MODEL_PATH)
                self._xgb_error = None
                logger.info("XGBoost model loaded successfully.")
            else:
                self._xgb_error = f"Model artifact not found at {XGBOOST_MODEL_PATH}"
        except Exception as e:
            self._xgb_model = None
            self._xgb_error = (
                f"Incompatible serialization with installed XGBoost (UBJSON schema mismatch from earlier export: {str(e)}). "
                f"Random Forest is the primary selected model."
            )
            logger.warning(self._xgb_error)

    @property
    def feature_columns(self) -> List[str]:
        if self._feature_columns is None:
            # Fallback to standard 8 features from notebook if file missing
            return [
                "Daily_Return", "Return_5D", "Volatility_20", "RSI_14",
                "Price_MA5_Ratio", "Price_MA20_Ratio", "Return_20D", "Volatility_5"
            ]
        return self._feature_columns

    @property
    def risk_thresholds(self) -> Dict[str, Any]:
        if self._risk_thresholds is None:
            return {
                "low_medium_threshold": 0.01147737690059371,
                "medium_high_threshold": 0.015208168902373627,
                "class_mapping": {"0": "Low Risk", "1": "Medium Risk", "2": "High Risk"},
                "selected_model": "Random Forest",
                "target": "standard deviation of next 20 daily returns"
            }
        return self._risk_thresholds

    @property
    def class_mapping(self) -> Dict[int, str]:
        raw_mapping = self.risk_thresholds.get("class_mapping", {})
        return {int(k): str(v) for k, v in raw_mapping.items()}

    def get_model(self, model_name: str) -> Any:
        normalized = model_name.strip().lower()
        if "forest" in normalized or "rf" in normalized:
            if self._rf_model is not None:
                return self._rf_model
            raise RuntimeError(f"Random Forest model is not available: {self._rf_error}")
        elif "xgb" in normalized or "boost" in normalized:
            if self._xgb_model is not None:
                return self._xgb_model
            raise RuntimeError(f"XGBoost model is not available: {self._xgb_error}")
        else:
            raise ValueError(f"Unknown model name '{model_name}'. Choose 'Random Forest' or 'XGBoost'.")

    def get_model_status(self) -> Dict[str, Any]:
        return {
            "random_forest": {
                "name": "Random Forest",
                "available": self._rf_model is not None,
                "is_selected": self.risk_thresholds.get("selected_model") == "Random Forest",
                "error": self._rf_error,
                "feature_count": getattr(self._rf_model, "n_features_in_", 8) if self._rf_model else None,
                "classes": [int(c) for c in getattr(self._rf_model, "classes_", [0, 1, 2])] if self._rf_model else None,
            },
            "xgboost": {
                "name": "XGBoost",
                "available": self._xgb_model is not None,
                "is_selected": self.risk_thresholds.get("selected_model") == "XGBoost",
                "error": self._xgb_error,
                "feature_count": getattr(self._xgb_model, "n_features_in_", 8) if self._xgb_model else None,
                "classes": [int(c) for c in getattr(self._xgb_model, "classes_", [0, 1, 2])] if self._xgb_model else None,
            }
        }

artifact_service = ArtifactService()
