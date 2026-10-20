"""
Model Inference Module for InvestIQ.
Formats input vectors, invokes trained models, and produces probability distributions.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np

def run_inference(
    model: Any,
    features_df: pd.DataFrame,
    class_mapping: Dict[int, str]
) -> List[Dict[str, Any]]:
    """
    Runs model prediction and generates structured class probabilities.
    """
    preds = model.predict(features_df)
    results = []

    has_proba = hasattr(model, "predict_proba")
    proba_matrix = model.predict_proba(features_df) if has_proba else None
    model_classes = getattr(model, "classes_", [0, 1, 2])

    for i, pred_raw in enumerate(preds):
        pred_int = int(pred_raw)
        label = class_mapping.get(pred_int, f"Class {pred_int}")

        probs = {}
        if has_proba and proba_matrix is not None:
            for j, c in enumerate(model_classes):
                c_lbl = class_mapping.get(int(c), f"Class {c}")
                probs[c_lbl] = round(float(proba_matrix[i][j]), 4)

        results.append({
            "predicted_class": pred_int,
            "predicted_label": label,
            "probabilities": probs,
        })

    return results
