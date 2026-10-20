"""
Model Evaluation Module for InvestIQ.
Calculates classification metrics, confusion matrices, and selects the winning model.
"""

from typing import Dict, Any, Tuple
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

def evaluate_single_model(name: str, model: Any, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
    preds = model.predict(X_test)
    return {
        "Model": name,
        "Accuracy": float(accuracy_score(y_test, preds)),
        "Balanced Accuracy": float(balanced_accuracy_score(y_test, preds)),
        "Weighted Precision": float(precision_score(y_test, preds, average="weighted", zero_division=0)),
        "Weighted Recall": float(recall_score(y_test, preds, average="weighted", zero_division=0)),
        "Weighted F1": float(f1_score(y_test, preds, average="weighted", zero_division=0)),
        "Macro F1": float(f1_score(y_test, preds, average="macro", zero_division=0)),
    }

def evaluate_models(
    rf_model: Any,
    xgb_model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Tuple[pd.DataFrame, str, Any]:
    """
    Evaluates both models and selects the winner based on higher Weighted F1 score (tie-breaker: Accuracy).
    """
    results = pd.DataFrame([
        evaluate_single_model("Random Forest", rf_model, X_test, y_test),
        evaluate_single_model("XGBoost", xgb_model, X_test, y_test),
    ]).sort_values(["Weighted F1", "Accuracy"], ascending=False).reset_index(drop=True)

    best_name = str(results.loc[0, "Model"])
    best_model = rf_model if best_name == "Random Forest" else xgb_model

    return results, best_name, best_model
