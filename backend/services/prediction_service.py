"""
Prediction Service for InvestIQ.
Executes risk classification using verified model artifacts, feature order, and class mappings.
"""

from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

from backend.services.artifact_service import artifact_service
from backend.services.feature_engineering_service import feature_engineering_service
from backend.services.market_data_service import market_data_service

class PredictionService:
    def __init__(self):
        self.class_mapping = artifact_service.class_mapping
        self.feature_columns = artifact_service.feature_columns

    def predict_risk(
        self,
        stock_symbol: str,
        model_name: str = "Random Forest",
        custom_features: Optional[Dict[str, float]] = None,
        as_of_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes risk prediction for a given stock or explicit feature set.
        """
        model = artifact_service.get_model(model_name)

        if custom_features is not None:
            # Validate required feature columns
            missing = [c for c in self.feature_columns if c not in custom_features]
            if missing:
                raise ValueError(f"Missing required feature columns: {missing}")
            feature_dict = {c: float(custom_features[c]) for c in self.feature_columns}
            data_date = as_of_date or "Custom Input / Upload"
        else:
            # Retrieve latest data from market data service
            stock_df = market_data_service.get_stock_df(stock_symbol)
            if stock_df.empty:
                raise ValueError(f"No market data available for {stock_symbol}.")
            feature_dict, data_date = feature_engineering_service.extract_latest_features(stock_df)

        # Assemble single-row DataFrame with exact columns and ordering
        X_df = pd.DataFrame([feature_dict])[self.feature_columns].astype(float)

        # Predict class
        pred_raw = model.predict(X_df)[0]
        pred_class = int(pred_raw)
        pred_label = self.class_mapping.get(pred_class, f"Class {pred_class}")

        # Compute probabilities if supported
        probabilities = {}
        if hasattr(model, "predict_proba"):
            try:
                proba_raw = model.predict_proba(X_df)[0]
                model_classes = getattr(model, "classes_", [0, 1, 2])
                for idx, c in enumerate(model_classes):
                    lbl = self.class_mapping.get(int(c), f"Class {c}")
                    probabilities[lbl] = round(float(proba_raw[idx]), 4)
            except Exception as e:
                probabilities = {"error": f"predict_proba unavailable: {str(e)}"}

        # Determine risk color and explanation
        color_map = {0: "green", 1: "amber", 2: "red"}
        risk_color = color_map.get(pred_class, "blue")

        explanation_map = {
            0: (
                f"{stock_symbol} is classified as Low Risk over the next 20 trading days. "
                f"Recent 20-day volatility ({feature_dict.get('Volatility_20', 0):.4f}) and price momentum "
                f"fall within the lower 33rd percentile threshold of historical regime distributions."
            ),
            1: (
                f"{stock_symbol} is classified as Medium Risk over the next 20 trading days. "
                f"Indicators suggest moderate market fluctuation consistent with typical equity price dispersion."
            ),
            2: (
                f"{stock_symbol} is classified as High Risk over the next 20 trading days. "
                f"Recent historical return variability or RSI divergence indicates elevated likelihood of "
                f"elevated price swings exceeding the upper threshold cutoff."
            )
        }
        explanation = explanation_map.get(
            pred_class,
            f"Risk classified as {pred_label} based on current technical indicator profile."
        )

        return {
            "stock_symbol": stock_symbol,
            "model_name": model_name,
            "predicted_class": pred_class,
            "predicted_label": pred_label,
            "risk_color": risk_color,
            "prediction_horizon": "20 trading days",
            "as_of_date": data_date,
            "probabilities": probabilities,
            "features_used": {k: round(v, 6) for k, v in feature_dict.items()},
            "explanation": explanation
        }

prediction_service = PredictionService()
