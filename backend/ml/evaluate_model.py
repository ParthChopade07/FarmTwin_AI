# -*- coding: utf-8 -*-
"""
AgriTwin -- Full ML Model Accuracy Evaluation Script
Run: python ml/evaluate_model.py
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_score, KFold, train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def generate_dataset(n=1500, seed=42):
    np.random.seed(seed)
    ndvi_mean = np.random.uniform(0.15, 0.88, n)
    rainfall_7d = np.random.uniform(0, 120, n)
    temp_7d = np.random.uniform(18, 42, n)
    humidity_7d = np.random.uniform(25, 95, n)
    crop_age = np.random.randint(10, 140, n)

    health_score = (
        ndvi_mean * 60 +
        np.where((temp_7d >= 22) & (temp_7d <= 32), 20, 5) +
        np.where((rainfall_7d >= 15) & (rainfall_7d <= 60), 20, 5) -
        np.where(humidity_7d > 85, 10, 0)
    )
    health_score = np.clip(health_score + np.random.normal(0, 3, n), 10, 99)

    X = pd.DataFrame({
        "ndvi_mean": ndvi_mean,
        "rainfall_7d_mm": rainfall_7d,
        "temperature_avg_7d_c": temp_7d,
        "humidity_avg_7d_pct": humidity_7d,
        "crop_age_days": crop_age,
    })
    return X, health_score


def main():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ model.pkl not found at: {MODEL_PATH}")
        print("   Run ml/train_ensemble.py first.")
        return

    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    features = bundle.get("features", bundle.get("feature_columns", []))

    print("\n" + "═" * 52)
    print("   AgriTwin — Crop Health ML Accuracy Report")
    print("═" * 52)
    print(f"  Model Type : {bundle.get('model_type', 'Unknown')}")
    print(f"  Features   : {features}")
    print(f"  Saved R²   : {bundle.get('r2_score', 'N/A')}")

    X, y = generate_dataset()
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Align columns
    for col in features:
        if col not in X.columns:
            X[col] = 0
            X_test[col] = 0
    X = X[features] if features else X
    X_test = X_test[features] if features else X_test

    y_pred = model.predict(X_test)

    r2  = r2_score(y_test, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae  = mean_absolute_error(y_test, y_pred)

    print("\n" + "═" * 52)
    print("   HOLD-OUT TEST SET (20% unseen data)")
    print("═" * 52)
    print(f"  R² Score  : {r2:.4f}   (1.0 = perfect)")
    print(f"  RMSE      : {rmse:.3f}  (avg error in health-score points)")
    print(f"  MAE       : {mae:.3f}  (mean absolute error)")

    # 5-Fold Cross Validation
    print("\n" + "═" * 52)
    print("   5-FOLD CROSS VALIDATION (generalisation check)")
    print("═" * 52)
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_r2 = cross_val_score(model, X, y, cv=kf, scoring="r2")
    cv_mae = -cross_val_score(model, X, y, cv=kf, scoring="neg_mean_absolute_error")
    print(f"  CV R² scores : {[round(s, 4) for s in cv_r2]}")
    print(f"  Mean R²      : {cv_r2.mean():.4f}")
    print(f"  Std Dev R²   : {cv_r2.std():.4f}  (lower = more stable, no overfitting)")
    print(f"  Mean CV MAE  : {cv_mae.mean():.3f}")

    # Feature Importance
    if hasattr(model, "feature_importances_"):
        print("\n" + "═" * 52)
        print("   FEATURE IMPORTANCE (which inputs matter most)")
        print("═" * 52)
        pairs = sorted(zip(features, model.feature_importances_), key=lambda x: -x[1])
        for feat, imp in pairs:
            bar = "█" * int(imp * 50)
            print(f"  {feat:<30} {bar}  {imp:.4f}")

    # Final Verdict
    print("\n" + "═" * 52)
    if r2 >= 0.90:
        verdict = "🟢 EXCELLENT — Model explains 90%+ variance"
    elif r2 >= 0.75:
        verdict = "🟡 GOOD — Model explains 75%+ variance"
    else:
        verdict = "🔴 NEEDS IMPROVEMENT — Consider more features"
    print(f"  Verdict: {verdict}")
    print(f"  Overfitting check: {'✅ STABLE' if cv_r2.std() < 0.01 else '⚠️  CHECK NEEDED'}")
    print("═" * 52)
    print("\n✅ Evaluation complete. Use these numbers in your CEP presentation.\n")


if __name__ == "__main__":
    main()
