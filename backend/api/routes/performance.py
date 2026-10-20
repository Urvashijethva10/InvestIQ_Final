"""
Performance and Evaluation endpoints for InvestIQ.
"""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse

from backend.services.evaluation_service import evaluation_service
from backend.core.paths import (
    OUTPUT_COMPARISON_PATH,
    OUTPUT_EVALUATION_REPORT_PATH,
    OUTPUT_CONFUSION_MATRIX_PATH,
    OUTPUT_FEATURE_IMPORTANCE_PATH
)

router = APIRouter(prefix="/performance", tags=["Performance"])

@router.get("/metrics")
def get_model_metrics():
    return evaluation_service.get_metrics_table()

@router.get("/confusion-matrix")
def get_confusion_matrix(model: str = "Random Forest"):
    return evaluation_service.get_confusion_matrix(model_name=model)

@router.get("/feature-importance")
def get_feature_importance():
    return evaluation_service.get_feature_importances()

@router.get("/report")
def get_evaluation_report():
    return evaluation_service.get_evaluation_report()

@router.get("/download-comparison")
def download_model_comparison():
    if not OUTPUT_COMPARISON_PATH.exists():
        raise HTTPException(status_code=404, detail="model_comparison.csv not generated yet.")
    return FileResponse(
        path=OUTPUT_COMPARISON_PATH,
        media_type="text/csv",
        filename="investiq_model_comparison.csv"
    )

@router.get("/download-report")
def download_evaluation_report():
    if not OUTPUT_EVALUATION_REPORT_PATH.exists():
        raise HTTPException(status_code=404, detail="evaluation_report.json not generated yet.")
    return FileResponse(
        path=OUTPUT_EVALUATION_REPORT_PATH,
        media_type="application/json",
        filename="investiq_evaluation_report.json"
    )

@router.get("/chart/{chart_type}")
def get_evaluation_chart(chart_type: str):
    if chart_type == "confusion-matrix":
        path = OUTPUT_CONFUSION_MATRIX_PATH
    elif chart_type == "feature-importance":
        path = OUTPUT_FEATURE_IMPORTANCE_PATH
    else:
        raise HTTPException(status_code=400, detail="Invalid chart type. Choose 'confusion-matrix' or 'feature-importance'.")

    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Chart {chart_type}.png not found.")

    return FileResponse(path=path, media_type="image/png")
