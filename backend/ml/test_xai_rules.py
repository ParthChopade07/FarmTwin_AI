"""
AgriTwin — XAI Rule Engine Unit Tests
Run: python ml/test_xai_rules.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.xai import analyze_farm_explainable_ai

PASS = "✅ PASS"
FAIL = "❌ FAIL"
errors = 0

print("\n" + "═" * 52)
print("   AgriTwin XAI Rule Engine — Unit Tests")
print("═" * 52)

# Test 1: Heavy rain + high soil moisture → HIGH RISK
r = analyze_farm_explainable_ai("FarmA", "wheat", 0.4, -12, 85, 200, 28, 70, 82, 100)
ok = r["overall_risk_score"] >= 65
print(f"  {PASS if ok else FAIL} Test 1 (Flood scenario)")
print(f"         Risk={r['overall_risk_score']}%  Status={r['overall_status']}")
if not ok: errors += 1

# Test 2: Good conditions → LOW / HEALTHY
r = analyze_farm_explainable_ai("FarmB", "rice", 0.72, 2, 30, 80, 26, 65, 55, 200)
ok = r["overall_risk_score"] < 35
print(f"  {PASS if ok else FAIL} Test 2 (Healthy scenario)")
print(f"         Risk={r['overall_risk_score']}%  Status={r['overall_status']}")
if not ok: errors += 1

# Test 3: Drought (low rain + high temp) → MODERATE+
r = analyze_farm_explainable_ai("FarmC", "maize", 0.5, -8, 2, 15, 38, 30, 35, 150)
ok = r["overall_risk_score"] >= 20
print(f"  {PASS if ok else FAIL} Test 3 (Drought scenario)")
print(f"         Risk={r['overall_risk_score']}%  Status={r['overall_status']}")
if not ok: errors += 1

# Test 4: NDVI drop without rain → Satellite decline flagged
r = analyze_farm_explainable_ai("FarmD", "cotton", 0.3, -20, 20, 50, 29, 60, 50, 200)
ok = any(f["category"] == "Satellite Sentinel-2" for f in r["contributing_factors"])
print(f"  {PASS if ok else FAIL} Test 4 (NDVI decline detection)")
print(f"         Factors: {[f['factor_name'] for f in r['contributing_factors']]}")
if not ok: errors += 1

# Test 5: Low elevation + heavy rain → Topography risk flagged
r = analyze_farm_explainable_ai("FarmE", "paddy", 0.6, -3, 70, 180, 27, 75, 78, 80)
ok = any(f["category"] == "Topography" for f in r["contributing_factors"])
print(f"  {PASS if ok else FAIL} Test 5 (Low elevation flood risk)")
print(f"         Factors: {[f['factor_name'] for f in r['contributing_factors']]}")
if not ok: errors += 1

print("\n" + "═" * 52)
if errors == 0:
    print("  🎯 ALL 5 TESTS PASSED — XAI Rules are working correctly!")
else:
    print(f"  ⚠️  {errors} test(s) failed. Check rule thresholds in xai.py")
print("═" * 52 + "\n")
