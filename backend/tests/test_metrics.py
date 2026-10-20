"""
Tests for Performance and Evaluation endpoints.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_metrics_endpoint():
    response = client.get("/api/performance/metrics")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    rf = next((m for m in data if m["model"] == "Random Forest"), None)
    assert rf is not None
    # Verified genuine notebook evaluation accuracy is ~48.81%
    assert round(rf["accuracy"], 2) == 0.49

def test_confusion_matrix_endpoint():
    response = client.get("/api/performance/confusion-matrix?model=Random+Forest")
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "Random Forest"
    assert "matrix" in data
    assert len(data["matrix"]) == 3
    assert len(data["matrix"][0]) == 3
    assert data["total_samples"] > 0

def test_feature_importance_endpoint():
    response = client.get("/api/performance/feature-importance")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 8
    top_feature = data[0]
    assert "feature" in top_feature
    assert "importance" in top_feature
    assert top_feature["importance"] > 0
