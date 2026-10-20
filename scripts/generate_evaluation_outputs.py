"""
Evaluation Outputs Generator for InvestIQ
Generates outputs/model_comparison.csv, outputs/confusion_matrix.png,
outputs/feature_importance.png, and outputs/evaluation_report.json
from genuine evaluation results and the verified chronological test split.
"""

import json
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix

def generate_outputs():
    workspace_dir = Path(__file__).resolve().parent.parent
    artifacts_dir = workspace_dir / "artifacts"
    data_dir = workspace_dir / "data" / "processed"
    outputs_dir = workspace_dir / "outputs"
    outputs_dir.mkdir(parents=True, exist_ok=True)

    print("Generating genuine evaluation outputs...")

    # Load feature columns & risk thresholds
    with open(artifacts_dir / "feature_columns.json", "r", encoding="utf-8") as f:
        features = json.load(f)

    with open(artifacts_dir / "risk_thresholds.json", "r", encoding="utf-8") as f:
        risk_thresholds = json.load(f)

    # 1. Reuse saved metrics for model_comparison.csv
    metrics_path = data_dir / "model_metrics.csv"
    if metrics_path.exists():
        metrics_df = pd.read_csv(metrics_path)
    elif (outputs_dir / "model_metrics.csv").exists():
        metrics_df = pd.read_csv(outputs_dir / "model_metrics.csv")
    else:
        raise FileNotFoundError("model_metrics.csv not found in data/processed/ or outputs/")

    metrics_df.to_csv(outputs_dir / "model_comparison.csv", index=False)
    metrics_df.to_csv(outputs_dir / "model_metrics.csv", index=False)
    print(f"[OK] Saved outputs/model_comparison.csv and outputs/model_metrics.csv")

    # 2. Chronological test split from model_data.csv
    data_path = data_dir / "model_data.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Missing {data_path}")

    model_df = pd.read_csv(data_path)
    dates = np.array(sorted(model_df["Date"].unique()))
    split_pos = int(len(dates) * 0.80)
    test_start = dates[split_pos]
    gap_start = dates[max(0, split_pos - 20)]

    train = model_df[model_df["Date"] < gap_start].copy()
    test = model_df[model_df["Date"] >= test_start].copy()

    X_test = test[features].astype(float)
    y_test = test["Risk_Label"].astype(int)

    # Load Random Forest (selected model)
    rf_model = joblib.load(artifacts_dir / "random_forest.joblib")
    rf_preds = rf_model.predict(X_test)

    # 3. Confusion Matrix
    class_names = ["Low Risk", "Medium Risk", "High Risk"]
    cm = confusion_matrix(y_test, rf_preds, labels=[0, 1, 2])

    plt.figure(figsize=(7, 6), dpi=150)
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
        cbar=True,
        annot_kws={"size": 13, "weight": "bold"}
    )
    plt.title("Random Forest - Test Confusion Matrix (Chronological Holdout)", fontsize=13, pad=12, fontweight="bold")
    plt.xlabel("Predicted Risk Class", fontsize=11, labelpad=10)
    plt.ylabel("Actual Risk Class", fontsize=11, labelpad=10)
    plt.tight_layout()
    cm_path = outputs_dir / "confusion_matrix.png"
    plt.savefig(cm_path)
    plt.close()
    print(f"[OK] Saved outputs/confusion_matrix.png")

    # 4. Feature Importance
    importances = rf_model.feature_importances_
    imp_df = pd.DataFrame({
        "Feature": features,
        "Importance": importances
    }).sort_values("Importance", ascending=True)

    plt.figure(figsize=(9, 5), dpi=150)
    colors = ["#1463E8" if i == len(imp_df)-1 else "#4A89F3" for i in range(len(imp_df))]
    bars = plt.barh(imp_df["Feature"], imp_df["Importance"], color=colors, edgecolor="#0E44A3", height=0.65)
    plt.title("Feature Importance - Random Forest (InvestIQ)", fontsize=13, pad=12, fontweight="bold")
    plt.xlabel("Gini Importance Score", fontsize=11, labelpad=8)
    plt.xlim(0, max(importances) * 1.15)
    for bar in bars:
        w = bar.get_width()
        plt.text(w + 0.003, bar.get_y() + bar.get_height()/2, f"{w:.4f}", va="center", ha="left", fontsize=9, color="#152238")
    plt.grid(axis="x", alpha=0.3, linestyle="--")
    plt.tight_layout()
    fi_path = outputs_dir / "feature_importance.png"
    plt.savefig(fi_path)
    plt.close()
    print(f"[OK] Saved outputs/feature_importance.png")

    # 5. Evaluation Report JSON
    report = {
        "report_title": "InvestIQ Evaluation Report",
        "provenance": "Generated from verified notebook chronological evaluation & model_data.csv",
        "dataset_split": {
            "total_dates": int(len(dates)),
            "train_dates_count": int(split_pos - 20),
            "test_dates_count": int(len(dates) - split_pos),
            "gap_dates_count": 20,
            "train_rows": int(len(train)),
            "test_rows": int(len(test)),
            "gap_start_date": str(gap_start),
            "test_start_date": str(test_start)
        },
        "risk_thresholds": risk_thresholds,
        "features": features,
        "metrics": metrics_df.to_dict(orient="records"),
        "random_forest_confusion_matrix": {
            "labels": class_names,
            "matrix": cm.tolist()
        },
        "feature_importances": imp_df.sort_values("Importance", ascending=False).to_dict(orient="records"),
        "selected_model": risk_thresholds.get("selected_model", "Random Forest"),
        "notes": [
            "Random Forest is the active selected model based on higher held-out weighted F1 score.",
            "XGBoost evaluation metrics are preserved from model_metrics.csv; model artifact is kept unchanged in artifacts/.",
            "Accuracy in the ~47-49% range reflects realistic non-leaking multi-class financial risk forecasting."
        ]
    }

    report_path = outputs_dir / "evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"[OK] Saved outputs/evaluation_report.json")
    print("All genuine outputs generated successfully.")

if __name__ == "__main__":
    generate_outputs()
