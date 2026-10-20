"""
Export Service for InvestIQ.
Generates CSV and JSON downloads for predictions, validated uploads, and evaluation tables.
"""

from typing import Dict, Any, List
import io
import pandas as pd
import json

class ExportService:
    def export_prediction_csv(self, prediction_result: Dict[str, Any]) -> str:
        """Converts prediction details and feature dictionary to a clean CSV string."""
        rows = [
            {"Key": "Stock Symbol", "Value": prediction_result.get("stock_symbol")},
            {"Key": "Model Used", "Value": prediction_result.get("model_name")},
            {"Key": "Predicted Class", "Value": prediction_result.get("predicted_class")},
            {"Key": "Predicted Risk Level", "Value": prediction_result.get("predicted_label")},
            {"Key": "Prediction Horizon", "Value": prediction_result.get("prediction_horizon")},
            {"Key": "Data As-Of Date", "Value": prediction_result.get("as_of_date")},
            {"Key": "Explanation", "Value": prediction_result.get("explanation")},
        ]

        # Add probabilities
        probs = prediction_result.get("probabilities", {})
        for label, prob in probs.items():
            rows.append({"Key": f"Probability ({label})", "Value": f"{prob:.4f}"})

        # Add features
        feats = prediction_result.get("features_used", {})
        for feat, val in feats.items():
            rows.append({"Key": f"Feature: {feat}", "Value": f"{val:.6f}"})

        df = pd.DataFrame(rows)
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue()

    def export_dataframe_csv(self, df: pd.DataFrame) -> str:
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue()

    def export_sample_template_csv(self) -> str:
        """Generates a clearly labeled demonstration template CSV with synthetic sample rows."""
        sample_data = {
            "Date": [
                "2026-01-01", "2026-01-02", "2026-01-05", "2026-01-06", "2026-01-07",
                "2026-01-08", "2026-01-09", "2026-01-12", "2026-01-13", "2026-01-14",
                "2026-01-15", "2026-01-16", "2026-01-19", "2026-01-20", "2026-01-21",
                "2026-01-22", "2026-01-23", "2026-01-26", "2026-01-27", "2026-01-28",
                "2026-01-29", "2026-01-30", "2026-02-02", "2026-02-03", "2026-02-04",
                "2026-02-05", "2026-02-06", "2026-02-09", "2026-02-10", "2026-02-11"
            ],
            "Stock": ["SAMPLE_STOCK"] * 30,
            "Close": [
                150.0, 151.2, 149.8, 152.4, 153.1,
                151.8, 154.0, 155.2, 153.9, 156.4,
                157.0, 155.8, 158.2, 159.0, 157.5,
                160.1, 161.4, 159.9, 162.0, 163.5,
                161.8, 164.2, 165.0, 163.7, 166.5,
                167.2, 165.9, 168.0, 169.5, 171.0
            ]
        }
        df = pd.DataFrame(sample_data)
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue()

export_service = ExportService()
