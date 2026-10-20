"""
Tests for Upload and Preprocessing endpoints.
"""

from fastapi.testclient import TestClient
import io
import pandas as pd
from backend.main import app

client = TestClient(app)

def test_upload_validate_valid_csv():
    dates = pd.date_range("2026-01-01", periods=30, freq="B").strftime("%Y-%m-%d")
    prices = [100.0 + i for i in range(30)]
    csv_str = "Date,Close\n" + "\n".join(f"{d},{p}" for d, p in zip(dates, prices))

    files = {"file": ("test.csv", io.BytesIO(csv_str.encode("utf-8")), "text/csv")}
    response = client.post("/api/uploads/validate", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["total_rows_parsed"] == 30
    assert data["can_predict"] is True
    assert data["computed_features"] is not None

def test_upload_validate_insufficient_rows():
    csv_str = "Date,Close\n2026-01-01,100\n2026-01-02,101\n"
    files = {"file": ("short.csv", io.BytesIO(csv_str.encode("utf-8")), "text/csv")}
    response = client.post("/api/uploads/validate", files=files)
    assert response.status_code == 400
    assert "Insufficient historical observations" in response.json()["detail"]

def test_upload_validate_non_csv():
    files = {"file": ("image.png", io.BytesIO(b"fake image data"), "image/png")}
    response = client.post("/api/uploads/validate", files=files)
    assert response.status_code == 400
    assert "Only CSV files" in response.json()["detail"]

def test_sample_template_download():
    response = client.get("/api/uploads/sample-template")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Date,Stock,Close" in response.text
