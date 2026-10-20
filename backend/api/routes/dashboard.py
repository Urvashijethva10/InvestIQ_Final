"""
Dashboard endpoints for InvestIQ.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from backend.services.dashboard_service import dashboard_service
from backend.services.market_data_service import market_data_service
from backend.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary():
    return dashboard_service.get_summary()

@router.get("/stock-trends")
def get_stock_trends(
    symbols: Optional[List[str]] = Query(None, description="List of stock tickers (e.g. RELIANCE.NS)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    normalize: bool = Query(True, description="Whether to normalize closing prices to base 100")
):
    if not symbols:
        symbols = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"]
    data = market_data_service.get_multi_stock_trends(
        symbols=symbols,
        start_date=start_date,
        end_date=end_date,
        normalize=normalize
    )
    return {"symbols": symbols, "normalized": normalize, "points_count": len(data), "data": data}
