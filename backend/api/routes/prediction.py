"""
Risk Prediction endpoints for InvestIQ.
"""

from fastapi import APIRouter, HTTPException, Response
from backend.schemas.prediction import PredictionRequest, PredictionResponse
from backend.services.prediction_service import prediction_service
from backend.services.export_service import export_service

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("/predict", response_model=PredictionResponse)
def predict_risk(payload: PredictionRequest):
    try:
        result = prediction_service.predict_risk(
            stock_symbol=payload.stock_symbol,
            model_name=payload.model_name or "Random Forest",
            custom_features=payload.custom_features,
            as_of_date=payload.as_of_date
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/export-csv")
def export_prediction_result(payload: PredictionRequest):
    try:
        result = prediction_service.predict_risk(
            stock_symbol=payload.stock_symbol,
            model_name=payload.model_name or "Random Forest",
            custom_features=payload.custom_features,
            as_of_date=payload.as_of_date
        )
        csv_data = export_service.export_prediction_csv(result)
        filename = f"investiq_prediction_{payload.stock_symbol}_{result['as_of_date']}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
