"""
Tests for Feature Engineering Service.
"""

import pandas as pd
import numpy as np
from backend.services.feature_engineering_service import feature_engineering_service

def test_feature_computation():
    dates = pd.date_range("2026-01-01", periods=30, freq="B")
    prices = [100.0 + i + (i % 3) for i in range(30)]
    df = pd.DataFrame({"Date": dates, "Close": prices})

    featured = feature_engineering_service.compute_features(df)
    for col in feature_engineering_service.feature_columns:
        assert col in featured.columns

def test_feature_extraction_latest():
    dates = pd.date_range("2026-01-01", periods=35, freq="B")
    prices = [200.0 + i * 0.5 for i in range(35)]
    df = pd.DataFrame({"Date": dates, "Close": prices})

    feats, latest_date = feature_engineering_service.extract_latest_features(df)
    assert len(feats) == 8
    assert isinstance(latest_date, str)
    for col in feature_engineering_service.feature_columns:
        assert col in feats
        assert isinstance(feats[col], (float, int))
        assert not np.isnan(feats[col])

def test_insufficient_history_rejection():
    dates = pd.date_range("2026-01-01", periods=10, freq="B")
    df = pd.DataFrame({"Date": dates, "Close": [100.0] * 10})
    try:
        feature_engineering_service.extract_latest_features(df)
        assert False, "Should have raised ValueError for insufficient history"
    except ValueError as e:
        assert "Insufficient history" in str(e)
