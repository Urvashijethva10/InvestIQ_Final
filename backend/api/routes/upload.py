"""
Upload and validation endpoints for InvestIQ.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from backend.services.preprocessing_service import preprocessing_service
from backend.services.prediction_service import prediction_service
from backend.services.export_service import export_service

router = APIRouter(prefix="/uploads", tags=["Uploads"])

@router.post("/validate")
async def validate_csv_upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    content = await file.read()
    try:
        diagnostics = preprocessing_service.validate_and_parse_csv(content, filename=file.filename)
        # Remove raw dataframe from json response
        diagnostics.pop("processed_dataframe", None)
        return diagnostics
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@router.post("/predict")
async def predict_from_upload(
    file: UploadFile = File(...),
    model_name: str = Form("Random Forest"),
    target_ticker: str = Form("USER_STOCK")
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    content = await file.read()
    try:
        diagnostics = preprocessing_service.validate_and_parse_csv(content, filename=file.filename)
        if not diagnostics["can_predict"] or not diagnostics["computed_features"]:
            raise HTTPException(
                status_code=400,
                detail="Could not compute valid feature indicators from this dataset. Check warnings and history length."
            )

        features = diagnostics["computed_features"]
        latest_date = diagnostics["end_date"]
        chosen_ticker = target_ticker if target_ticker in diagnostics["tickers_detected"] else diagnostics["tickers_detected"][0]

        prediction = prediction_service.predict_risk(
            stock_symbol=chosen_ticker,
            model_name=model_name,
            custom_features=features,
            as_of_date=latest_date
        )

        return {
            "validation": {
                "filename": file.filename,
                "total_rows_parsed": diagnostics["total_rows_parsed"],
                "date_range": f"{diagnostics['start_date']} to {diagnostics['end_date']}",
                "tickers_detected": diagnostics["tickers_detected"],
                "warnings": diagnostics["warnings"]
            },
            "prediction": prediction
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.get("/sample-template")
def download_sample_template():
    csv_data = export_service.export_sample_template_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=investiq_sample_stock_data.csv"}
    )
