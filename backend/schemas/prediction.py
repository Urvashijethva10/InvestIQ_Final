"""
Pydantic Schemas for Prediction endpoints in InvestIQ.
"""

from typing import Dict, Optional, Any, List
from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    stock_symbol: str = Field(..., description="Stock ticker symbol (e.g. RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS)")
    model_name: Optional[str] = Field("Random Forest", description="Model to use: 'Random Forest' or 'XGBoost'")
    custom_features: Optional[Dict[str, float]] = Field(None, description="Optional custom values for the 8 features")
    as_of_date: Optional[str] = Field(None, description="Optional date representation for custom feature vectors")

class PredictionResponse(BaseModel):
    stock_symbol: str
    model_name: str
    predicted_class: int
    predicted_label: str
    risk_color: str
    prediction_horizon: str
    as_of_date: str
    probabilities: Dict[str, float]
    features_used: Dict[str, float]
    explanation: str

class UploadPredictRequest(BaseModel):
    model_name: Optional[str] = Field("Random Forest", description="Model to use: 'Random Forest' or 'XGBoost'")
    stock_symbol: Optional[str] = Field("USER_STOCK", description="Target stock series to analyze")
