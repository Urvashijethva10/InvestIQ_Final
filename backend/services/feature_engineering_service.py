"""
Feature Engineering Service for InvestIQ.
Implements the exact technical indicators from the verified notebook.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from backend.services.artifact_service import artifact_service

class FeatureEngineeringService:
    def __init__(self):
        self.feature_columns = artifact_service.feature_columns

    def compute_features(self, df: pd.DataFrame, include_target: bool = False) -> pd.DataFrame:
        """
        Computes features on a DataFrame containing at least 'Date' and 'Close'.
        DataFrame must be sorted by Date.
        """
        g = df.sort_values("Date").copy()
        c = g["Close"].astype(float)
        r = c.pct_change()

        g["Daily_Return"] = r
        g["Return_5D"] = c.pct_change(5)
        g["Volatility_20"] = r.rolling(20).std()

        delta = c.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = 100.0 - 100.0 / (1.0 + rs)
        rsi = rsi.where(~(loss == 0), 100.0)
        g["RSI_14"] = rsi

        g["Price_MA5_Ratio"] = c / c.rolling(5).mean()
        g["Price_MA20_Ratio"] = c / c.rolling(20).mean()
        g["Return_20D"] = c.pct_change(20)
        g["Volatility_5"] = r.rolling(5).std()

        if include_target:
            # Future 20-day volatility (rolling std of returns from t+1 to t+20)
            g["Future_Volatility_20"] = r.shift(-1).iloc[::-1].rolling(20, min_periods=20).std().iloc[::-1]

        # Clean inf / -inf
        g = g.replace([np.inf, -np.inf], np.nan)
        return g

    def extract_latest_features(self, df: pd.DataFrame) -> Tuple[Dict[str, float], str]:
        """
        Computes features on input DataFrame and returns the latest complete feature dictionary
        and its corresponding date.
        """
        if len(df) < 20:
            raise ValueError(f"Insufficient history: {len(df)} rows provided. At least 20 observations required.")

        featured_df = self.compute_features(df, include_target=False)
        usable_df = featured_df.dropna(subset=self.feature_columns)

        if usable_df.empty:
            raise ValueError("Could not compute valid features. Check for excessive missing values or short history.")

        latest_row = usable_df.iloc[-1]
        feature_dict = {feat: float(latest_row[feat]) for feat in self.feature_columns}
        latest_date = str(latest_row["Date"])[:10]

        return feature_dict, latest_date

    def get_feature_matrix(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Returns the feature DataFrame ordered exactly by feature_columns.json.
        """
        return df[self.feature_columns].astype(float)

feature_engineering_service = FeatureEngineeringService()
