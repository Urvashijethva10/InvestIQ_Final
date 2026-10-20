"""
Live API Verification Script for InvestIQ
Tests all API endpoints through both direct backend (port 8000) and Vite proxy (port 5173).
"""

import urllib.request
import json

def test_endpoints(base_url="http://127.0.0.1:8000"):
    print(f"\n--- Testing API at {base_url} ---")

    # 1. Root
    with urllib.request.urlopen(f"{base_url}/") as res:
        content = res.read().decode("utf-8")
        if "<!DOCTYPE html>" in content or "<html" in content:
            print(f"[OK] Root: Frontend React HTML app delivered successfully")
        else:
            data = json.loads(content)
            print(f"[OK] Root: {data.get('app')} - {data.get('tagline')}")

    # 2. Health
    with urllib.request.urlopen(f"{base_url}/api/health") as res:
        data = json.loads(res.read())
        print(f"[OK] Health: {data.get('status')} | Model: {data.get('selected_model')} | Rows: {data.get('dataset_rows')}")

    # 3. Dashboard Summary
    with urllib.request.urlopen(f"{base_url}/api/dashboard/summary") as res:
        data = json.loads(res.read())
        print(f"[OK] Summary: {data.get('supported_stocks_count')} stocks, latest date: {data.get('latest_valid_date')}")

    # 4. Stock Trends
    with urllib.request.urlopen(f"{base_url}/api/dashboard/stock-trends?normalize=true") as res:
        data = json.loads(res.read())
        print(f"[OK] Trends: {data.get('points_count')} points for {data.get('symbols')}")

    # 5. Prediction
    req = urllib.request.Request(
        f"{base_url}/api/predictions/predict",
        data=json.dumps({"stock_symbol": "INFY.NS", "model_name": "Random Forest"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read())
        print(f"[OK] Prediction: {data.get('stock_symbol')} -> {data.get('predicted_label')} | Probs: {data.get('probabilities')}")

    # 6. Performance Metrics
    with urllib.request.urlopen(f"{base_url}/api/performance/metrics") as res:
        data = json.loads(res.read())
        print(f"[OK] Metrics: {len(data)} models evaluated")
        for m in data:
            print(f"     - {m['model']}: Accuracy {m['accuracy']*100:.2f}%, Weighted F1 {m['weighted_f1']*100:.2f}%")

    # 7. Confusion Matrix
    with urllib.request.urlopen(f"{base_url}/api/performance/confusion-matrix?model=Random+Forest") as res:
        data = json.loads(res.read())
        print(f"[OK] Confusion Matrix: {data.get('model')} total test samples: {data.get('total_samples')}")

    # 8. Feature Importance
    with urllib.request.urlopen(f"{base_url}/api/performance/feature-importance") as res:
        data = json.loads(res.read())
        print(f"[OK] Feature Importance: {len(data)} features (Top: {data[0]['feature']} = {data[0]['importance']})")

    # 9. Explorer History
    with urllib.request.urlopen(f"{base_url}/api/data/history?symbol=HDFCBANK.NS") as res:
        data = json.loads(res.read())
        print(f"[OK] History: {data.get('count')} records for {data.get('symbol')}")

    # 10. Sample Template Download
    with urllib.request.urlopen(f"{base_url}/api/uploads/sample-template") as res:
        content = res.read().decode("utf-8")
        print(f"[OK] Sample Template: {len(content.splitlines())} lines downloaded")

if __name__ == "__main__":
    test_endpoints("http://127.0.0.1:8000")
    test_endpoints("http://127.0.0.1:5173")
