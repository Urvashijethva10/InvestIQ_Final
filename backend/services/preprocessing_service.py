"""
Preprocessing & Upload Service for InvestIQ.
Validates, cleans, and structures user-uploaded CSV files.
"""

from typing import Dict, Any, List, Optional, Tuple
import io
import pandas as pd
import numpy as np

from backend.services.feature_engineering_service import feature_engineering_service
from backend.services.artifact_service import artifact_service
from backend.core.config import settings

class PreprocessingService:
    def __init__(self):
        self.feature_columns = artifact_service.feature_columns

    def validate_and_parse_csv(
        self,
        file_bytes: bytes,
        filename: str = "upload.csv"
    ) -> Dict[str, Any]:
        """
        Validates uploaded CSV file bytes and extracts structural diagnostics and preview.
        """
        warnings_list: List[str] = []

        if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB.")

        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        if df.empty:
            raise ValueError("Uploaded CSV is empty.")

        # Normalize column names: strip whitespace
        df.columns = [str(c).strip() for c in df.columns]

        # Map possible date column names
        date_candidates = ["Date", "date", "DATE", "Datetime", "datetime", "Timestamp", "timestamp"]
        date_col = next((c for c in date_candidates if c in df.columns), None)
        if date_col is None:
            raise ValueError(f"Missing required date column. Expected one of: {date_candidates}")

        # Map possible close price column names
        close_candidates = ["Close", "close", "CLOSE", "Adj Close", "adj_close", "Adj_Close", "Price", "price"]
        close_col = next((c for c in close_candidates if c in df.columns), None)
        if close_col is None:
            raise ValueError(f"Missing required price column. Expected one of: {close_candidates}")

        # Standardize names
        df = df.rename(columns={date_col: "Date", close_col: "Close"})

        # Map ticker column if present
        ticker_candidates = ["Stock", "stock", "Ticker", "ticker", "Symbol", "symbol"]
        ticker_col = next((c for c in ticker_candidates if c in df.columns), None)
        if ticker_col is not None:
            df = df.rename(columns={ticker_col: "Stock"})
            tickers_detected = [str(t) for t in df["Stock"].dropna().unique().tolist()]
        else:
            df["Stock"] = "USER_STOCK"
            tickers_detected = ["USER_STOCK"]

        # Parse Dates
        original_rows = len(df)
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        null_dates = df["Date"].isna().sum()
        if null_dates > 0:
            warnings_list.append(f"Dropped {null_dates} rows with invalid date formats.")
            df = df.dropna(subset=["Date"])

        # Validate numeric Close price
        df["Close"] = pd.to_numeric(df["Close"], errors="coerce")
        null_prices = df["Close"].isna().sum()
        if null_prices > 0:
            warnings_list.append(f"Dropped {null_prices} rows with non-numeric prices.")
            df = df.dropna(subset=["Close"])

        # Validate strictly positive prices
        non_positive = (df["Close"] <= 0).sum()
        if non_positive > 0:
            warnings_list.append(f"Dropped {non_positive} rows with zero or negative prices.")
            df = df[df["Close"] > 0]

        # Check duplicates
        dup_count = df.duplicated(subset=["Date", "Stock"]).sum()
        if dup_count > 0:
            warnings_list.append(f"Removed {dup_count} duplicate date entries.")
            df = df.drop_duplicates(subset=["Date", "Stock"])

        # Sort chronologically
        df = df.sort_values(["Stock", "Date"]).reset_index(drop=True)

        if len(df) < settings.MIN_OBSERVATIONS_REQUIRED:
            raise ValueError(
                f"Insufficient historical observations: file contains {len(df)} valid records. "
                f"A minimum of {settings.MIN_OBSERVATIONS_REQUIRED} trading days is required to calculate 20-day volatility and indicators."
            )

        start_date = df["Date"].min().strftime("%Y-%m-%d")
        end_date = df["Date"].max().strftime("%Y-%m-%d")

        # Format sample preview (first 10 rows)
        preview_cols = ["Date", "Close"] + (["Stock"] if "Stock" in df.columns else [])
        for col in ["Open", "High", "Low", "Volume"]:
            if col in df.columns:
                preview_cols.append(col)

        sample_df = df[preview_cols].head(10).copy()
        sample_df["Date"] = sample_df["Date"].dt.strftime("%Y-%m-%d")
        sample_preview = sample_df.to_dict(orient="records")

        # Test feature engineering on primary series
        primary_stock = tickers_detected[0]
        stock_slice = df[df["Stock"] == primary_stock].copy()

        computed_features = None
        feature_error = None
        if len(stock_slice) >= settings.MIN_OBSERVATIONS_REQUIRED:
            try:
                computed_features, latest_date = feature_engineering_service.extract_latest_features(stock_slice)
            except Exception as e:
                feature_error = str(e)
                warnings_list.append(f"Feature computation warning: {feature_error}")

        return {
            "filename": filename,
            "is_valid": True,
            "total_rows_parsed": len(df),
            "original_rows": original_rows,
            "start_date": start_date,
            "end_date": end_date,
            "tickers_detected": tickers_detected,
            "columns_detected": list(df.columns),
            "warnings": warnings_list,
            "sample_preview": sample_preview,
            "computed_features": computed_features,
            "can_predict": computed_features is not None,
            "processed_dataframe": df
        }

preprocessing_service = PreprocessingService()
