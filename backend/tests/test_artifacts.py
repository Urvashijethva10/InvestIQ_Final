"""
Tests for Artifact loading and verification.
"""

from backend.services.artifact_service import artifact_service

def test_feature_columns_loaded():
    cols = artifact_service.feature_columns
    assert isinstance(cols, list)
    assert len(cols) == 8
    expected = [
        "Daily_Return", "Return_5D", "Volatility_20", "RSI_14",
        "Price_MA5_Ratio", "Price_MA20_Ratio", "Return_20D", "Volatility_5"
    ]
    assert cols == expected

def test_risk_thresholds_loaded():
    thresh = artifact_service.risk_thresholds
    assert "low_medium_threshold" in thresh
    assert "medium_high_threshold" in thresh
    assert thresh["low_medium_threshold"] < thresh["medium_high_threshold"]
    assert "class_mapping" in thresh

def test_class_mapping():
    mapping = artifact_service.class_mapping
    assert mapping[0] == "Low Risk"
    assert mapping[1] == "Medium Risk"
    assert mapping[2] == "High Risk"

def test_random_forest_model_active():
    model = artifact_service.get_model("Random Forest")
    assert model is not None
    assert getattr(model, "n_features_in_", None) == 8
