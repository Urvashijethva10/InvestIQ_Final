"""
Health check endpoints for InvestIQ.
"""

import sys
from fastapi import APIRouter
from backend.services.artifact_service import artifact_service
from backend.services.market_data_service import market_data_service

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    models_status = artifact_service.get_model_status()
    has_active_model = any(m["available"] for m in models_status.values())

    return {
        "status": "healthy" if has_active_model else "degraded",
        "service": "InvestIQ API",
        "version": "1.0.0",
        "python_version": sys.version.split()[0],
        "models": models_status,
        "processed_data_available": market_data_service.has_data,
        "dataset_rows": len(market_data_service._df) if market_data_service.has_data else 0,
        "features_loaded": len(artifact_service.feature_columns),
        "selected_model": artifact_service.risk_thresholds.get("selected_model", "Random Forest"),
    }
