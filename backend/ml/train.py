"""
Model Training Module for InvestIQ.
Implements the exact training procedures for Random Forest and XGBoost from the notebook.
"""

from typing import Tuple, Dict, Any
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.class_weight import compute_sample_weight
import xgboost as xgb

SEED = 42

def train_models(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    rf_params: Dict[str, Any] = None,
    xgb_params: Dict[str, Any] = None
) -> Tuple[RandomForestClassifier, xgb.XGBClassifier]:
    """
    Trains Random Forest and XGBoost classifiers using the notebook's exact hyperparameters.
    """
    if rf_params is None:
        rf_params = {
            "n_estimators": 400,
            "max_depth": 12,
            "min_samples_leaf": 4,
            "max_features": "sqrt",
            "class_weight": "balanced_subsample",
            "random_state": SEED,
            "n_jobs": -1
        }

    if xgb_params is None:
        xgb_params = {
            "n_estimators": 400,
            "max_depth": 4,
            "learning_rate": 0.04,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "reg_lambda": 2,
            "objective": "multi:softprob",
            "num_class": 3,
            "eval_metric": "mlogloss",
            "random_state": SEED,
            "n_jobs": -1,
            "tree_method": "hist"
        }

    print("Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(**rf_params)
    rf_model.fit(X_train, y_train)

    print("Training XGBoost Classifier...")
    sample_weights = compute_sample_weight(class_weight="balanced", y=y_train)
    xgb_model = xgb.XGBClassifier(**xgb_params)
    xgb_model.fit(X_train, y_train, sample_weight=sample_weights)

    return rf_model, xgb_model
