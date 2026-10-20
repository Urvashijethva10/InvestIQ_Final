"""
Pydantic Schemas for Dashboard and Exploration endpoints in InvestIQ.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class StockInfo(BaseModel):
    symbol: str
    name: str
    sector: str
    latest_date: Optional[str]
    rows: int
    latest_close: Optional[float]

class DashboardSummaryResponse(BaseModel):
    supported_stocks_count: int
    available_models_count: int
    prediction_horizon_days: int
    latest_valid_date: Optional[str]
    features_count: int
    risk_classes_count: int
    dataset_rows_count: int
    selected_model: str
    models_status: Dict[str, Any]
    supported_stocks: List[StockInfo]
    backend_health: str
    risk_classes: List[str]

class StockTrendPoint(BaseModel):
    date: str
    close: float
    normalized_close: Optional[float] = None
    Daily_Return: Optional[float] = None
    Return_5D: Optional[float] = None
    Volatility_20: Optional[float] = None
    RSI_14: Optional[float] = None
    Price_MA5_Ratio: Optional[float] = None
    Price_MA20_Ratio: Optional[float] = None
    Return_20D: Optional[float] = None
    Volatility_5: Optional[float] = None
    Risk_Label: Optional[int] = None
