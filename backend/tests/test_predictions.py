"""
Tests for Prediction Endpoint and Service.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_predict_endpoint_valid_stock():
    payload = {
        "stock_symbol": "RELIANCE.NS",
        "model_name": "Random Forest"
    }
    response = client.post("/api/predictions/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["stock_symbol"] == "RELIANCE.NS"
    assert data["model_name"] == "Random Forest"
    assert data["predicted_class"] in [0, 1, 2]
    assert data["predicted_label"] in ["Low Risk", "Medium Risk", "High Risk"]
    assert data["risk_color"] in ["green", "amber", "red"]
    assert "probabilities" in data
    assert len(data["probabilities"]) == 3
    assert "features_used" in data
    assert len(data["features_used"]) == 8

def test_predict_endpoint_custom_features():
    custom_feats = {
        "Daily_Return": 0.005,
        "Return_5D": 0.02,
        "Volatility_20": 0.012,
        "RSI_14": 55.4,
        "Price_MA5_Ratio": 1.01,
        "Price_MA20_Ratio": 1.02,
        "Return_20D": 0.04,
        "Volatility_5": 0.008
    }
    payload = {
        "stock_symbol": "CUSTOM_STOCK",
        "model_name": "Random Forest",
        "custom_features": custom_feats
    }
    response = client.post("/api/predictions/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_label"] in ["Low Risk", "Medium Risk", "High Risk"]

def test_predict_invalid_model():
    payload = {
        "stock_symbol": "RELIANCE.NS",
        "model_name": "UnknownNonExistentModel"
    }
    response = client.post("/api/predictions/predict", json=payload)
    assert response.status_code == 400
