"""
Data Explorer endpoints for InvestIQ.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Response
import pandas as pd

from backend.services.market_data_service import market_data_service
from backend.services.export_service import export_service

router = APIRouter(prefix="/data", tags=["Explorer"])

@router.get("/stocks")
def get_supported_stocks():
    return market_data_service.get_supported_stocks()

@router.get("/history")
def get_stock_history(
    symbol: str = Query("RELIANCE.NS", description="Stock symbol"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    normalize: bool = Query(False, description="Normalize close to 100")
):
    data = market_data_service.get_stock_history(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        normalize=normalize
    )
    return {
        "symbol": symbol,
        "count": len(data),
        "start_date": start_date,
        "end_date": end_date,
        "records": data
    }

@router.get("/features")
def get_features_history(
    symbol: str = Query("RELIANCE.NS", description="Stock symbol"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    data = market_data_service.get_stock_history(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        normalize=False
    )
    return {
        "symbol": symbol,
        "count": len(data),
        "records": data
    }

@router.get("/export")
def export_historical_data(
    symbol: str = Query("RELIANCE.NS", description="Stock symbol"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    records = market_data_service.get_stock_history(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        normalize=False
    )
    if not records:
        raise HTTPException(status_code=404, detail="No historical records found for the requested filters.")

    df = pd.DataFrame(records)
    csv_str = export_service.export_dataframe_csv(df)
    filename = f"investiq_{symbol}_history.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
