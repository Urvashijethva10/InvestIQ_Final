"""
Application configuration for InvestIQ backend.
"""

from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "InvestIQ"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DESCRIPTION: str = "InvestIQ - Investment Risk Intelligence & Prediction Platform"

    # CORS origins - restricted for local development
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://invest-iq-final.vercel.app",
    ]

    # Supported Equities
    SUPPORTED_TICKERS: List[dict] = [
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "sector": "Energy & Conglomerate"},
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "sector": "Information Technology"},
        {"symbol": "INFY.NS", "name": "Infosys Ltd", "sector": "Information Technology"},
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "sector": "Banking & Financial Services"},
    ]

    # Model configuration
    MODELS: List[str] = ["Random Forest", "XGBoost"]
    DEFAULT_MODEL: str = "Random Forest"

    # Prediction horizon in trading days
    PREDICTION_HORIZON_DAYS: int = 20

    # Minimum history required for rolling features (max rolling window is 20 days + lookback)
    MIN_OBSERVATIONS_REQUIRED: int = 25

    # Max upload file size in bytes (10 MB)
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024

settings = Settings()
