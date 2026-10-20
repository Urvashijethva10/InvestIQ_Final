"""
Market Data Service for InvestIQ.
Manages access to processed and raw historical stock data.
"""

from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

from backend.core.paths import MODEL_DATA_PATH, RAW_STOCK_DATA_PATH
from backend.core.config import settings

class MarketDataService:
    _instance: Optional["MarketDataService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MarketDataService, cls).__new__(cls)
            cls._instance._df = None
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.load_data()
        self._initialized = True

    def load_data(self):
        """Loads historical market data from model_data.csv or stock_data.csv."""
        if MODEL_DATA_PATH.exists():
            df = pd.read_csv(MODEL_DATA_PATH)
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            df = df.dropna(subset=["Date", "Stock", "Close"]).sort_values(["Stock", "Date"])
            self._df = df
        elif RAW_STOCK_DATA_PATH.exists():
            df = pd.read_csv(RAW_STOCK_DATA_PATH)
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            df = df.dropna(subset=["Date", "Stock", "Close"]).sort_values(["Stock", "Date"])
            self._df = df
        else:
            self._df = pd.DataFrame()

    @property
    def has_data(self) -> bool:
        return self._df is not None and not self._df.empty

    def get_supported_stocks(self) -> List[Dict[str, Any]]:
        meta_by_symbol = {item["symbol"]: item for item in settings.SUPPORTED_TICKERS}
        results = []

        if not self.has_data:
            return [
                {**item, "latest_date": None, "rows": 0, "latest_close": None}
                for item in settings.SUPPORTED_TICKERS
            ]

        for stock, g in self._df.groupby("Stock"):
            meta = meta_by_symbol.get(stock, {"symbol": stock, "name": stock, "sector": "Equities"})
            latest_row = g.iloc[-1]
            results.append({
                "symbol": stock,
                "name": meta.get("name", stock),
                "sector": meta.get("sector", "General"),
                "latest_date": latest_row["Date"].strftime("%Y-%m-%d"),
                "rows": int(len(g)),
                "latest_close": round(float(latest_row["Close"]), 2),
            })
        return results

    def get_latest_date(self) -> Optional[str]:
        if not self.has_data:
            return None
        max_date = self._df["Date"].max()
        return max_date.strftime("%Y-%m-%d") if pd.notnull(max_date) else None

    def get_stock_df(self, symbol: str) -> pd.DataFrame:
        if not self.has_data:
            return pd.DataFrame()
        g = self._df[self._df["Stock"] == symbol].copy()
        return g.sort_values("Date")

    def get_stock_history(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        normalize: bool = False
    ) -> List[Dict[str, Any]]:
        df = self.get_stock_df(symbol)
        if df.empty:
            return []

        if start_date:
            df = df[df["Date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["Date"] <= pd.to_datetime(end_date)]

        if df.empty:
            return []

        records = []
        base_price = float(df.iloc[0]["Close"]) if normalize and float(df.iloc[0]["Close"]) > 0 else 1.0

        for _, row in df.iterrows():
            close_val = float(row["Close"])
            normalized_val = (close_val / base_price * 100.0) if normalize else close_val

            item = {
                "date": row["Date"].strftime("%Y-%m-%d"),
                "close": round(close_val, 2),
                "normalized_close": round(normalized_val, 2),
            }
            # Add features if present in model_data
            for col in ["Daily_Return", "Return_5D", "Volatility_20", "RSI_14", "Price_MA5_Ratio", "Price_MA20_Ratio", "Return_20D", "Volatility_5", "Risk_Label"]:
                if col in row and pd.notnull(row[col]):
                    item[col] = round(float(row[col]), 4) if isinstance(row[col], (float, int)) else row[col]

            records.append(item)
        return records

    def get_multi_stock_trends(
        self,
        symbols: List[str],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        normalize: bool = True
    ) -> List[Dict[str, Any]]:
        """Combines multiple equities into a single time series aligned by date."""
        if not self.has_data or not symbols:
            return []

        filtered = self._df[self._df["Stock"].isin(symbols)].copy()
        if start_date:
            filtered = filtered[filtered["Date"] >= pd.to_datetime(start_date)]
        if end_date:
            filtered = filtered[filtered["Date"] <= pd.to_datetime(end_date)]

        if filtered.empty:
            return []

        pivoted = filtered.pivot_table(index="Date", columns="Stock", values="Close").sort_index()

        if normalize:
            # Normalize each column to base 100 on first available observation
            for col in pivoted.columns:
                valid_first = pivoted[col].dropna()
                if not valid_first.empty and valid_first.iloc[0] > 0:
                    pivoted[col] = (pivoted[col] / valid_first.iloc[0]) * 100.0

        results = []
        for dt, row in pivoted.iterrows():
            item = {"date": dt.strftime("%Y-%m-%d")}
            for s in symbols:
                if s in row and pd.notnull(row[s]):
                    item[s] = round(float(row[s]), 2)
            results.append(item)

        return results

market_data_service = MarketDataService()
