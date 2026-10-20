"""
Tests for Health Endpoint.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "InvestIQ"
    assert "docs" in data

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "InvestIQ API"
    assert "status" in data
    assert "models" in data
    assert "random_forest" in data["models"]
    assert data["models"]["random_forest"]["available"] is True
    assert data["processed_data_available"] is True
