"""
Dashboard Service for InvestIQ.
Aggregates key statistics, model health, and data availability for the Overview page.
"""

from typing import Dict, Any
from backend.services.artifact_service import artifact_service
from backend.services.market_data_service import market_data_service
from backend.core.config import settings

class DashboardService:
    def get_summary(self) -> Dict[str, Any]:
        models_status = artifact_service.get_model_status()
        available_models = sum(1 for m in models_status.values() if m.get("available", False))
        latest_date = market_data_service.get_latest_date()
        supported_stocks = market_data_service.get_supported_stocks()

        total_rows = 0
        if market_data_service.has_data:
            total_rows = len(market_data_service._df)

        return {
            "supported_stocks_count": len(settings.SUPPORTED_TICKERS),
            "available_models_count": available_models,
            "prediction_horizon_days": settings.PREDICTION_HORIZON_DAYS,
            "latest_valid_date": latest_date,
            "features_count": len(artifact_service.feature_columns),
            "risk_classes_count": len(artifact_service.class_mapping),
            "dataset_rows_count": total_rows,
            "selected_model": artifact_service.risk_thresholds.get("selected_model", "Random Forest"),
            "models_status": models_status,
            "supported_stocks": supported_stocks,
            "backend_health": "healthy" if available_models > 0 else "degraded",
            "risk_classes": list(artifact_service.class_mapping.values()),
        }

dashboard_service = DashboardService()
