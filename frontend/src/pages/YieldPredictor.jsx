import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  TrendingUp,
  DollarSign,
  Sparkles,
  RefreshCw,
  Sliders,
  Droplets,
  Sun,
  Layers,
  Zap,
  ShieldCheck,
  ArrowRight,
  Calculator,
  PieChart,
  Percent,
} from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";
import { CROPS } from "../utils/constants.js";

const SEED_TYPES = [
  { id: "hyv", label: "Hybrid / High Yield Variety (HYV)" },
  { id: "certified", label: "Certified Commercial Seed" },
  { id: "local", label: "Local / Saved Seed" },
  { id: "organic", label: "Organic Certified Seed" },
];

const FERTILIZER_OPTIONS = [
  { id: "Standard NPK (Recommended)", label: "🌱 Standard NPK & Balanced Micro-nutrients" },
  { id: "+20% High Nitrogen / Urea", label: "⚡ High Nitrogen Booster (+20% Urea)" },
  { id: "-20% Reduced Fertilizer", label: "📉 Low Input / Reduced Fertilizer (-20%)" },
  { id: "Organic Bio-fertilizer + Vermicompost", label: "🌿 100% Organic Bio-fertilizer + Vermicompost" },
];

const WATER_OPTIONS = [
  { id: "Regular Drip Irrigation", label: "💧 Precision Drip Irrigation (Recommended)" },
  { id: "Deficit / Delayed Irrigation", label: "⚠️ Deficit / Delayed Water Supply" },
  { id: "Flood Irrigation", label: "🌊 Traditional Flood Irrigation" },
];

const WEATHER_OPTIONS = [
  { id: "Normal Seasonal Rain", label: "☀️ Normal Seasonal Rain & Temp" },
  { id: "Heavy Rain (+25%)", label: "🌧️ Heavy Monsoonal Rainfall (+25%)" },
  { id: "Drought / Heatwave (-30%)", label: "🔥 Drought / Heatwave (-30% Rain)" },
];

const SOIL_OPTIONS = [
  { id: "Black Cotton Clay", label: "🧱 Black Cotton Heavy Clay (High Retention)" },
  { id: "Alluvial Loam", label: "🌾 Alluvial Fertile Loam" },
  { id: "Red Sandy Soil", label: "🏜️ Red Sandy Loam" },
  { id: "Laterite Soil", label: "🪨 Laterite Acidic Soil" },
];

export default function YieldPredictor({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t, i18n } = useTranslation();
  // Active Tab: "yield" (Yield & Harvest Predictor) | "roi" (Crop ROI & Season Profitability)
  const [activeTab, setActiveTab] = useState("yield");

  // Farm State
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");

  // 1) Yield Predictor State
  const [fertilizerMode, setFertilizerMode] = useState("Standard NPK (Recommended)");
  const [waterMode, setWaterMode] = useState("Regular Drip Irrigation");
  const [weatherScenario, setWeatherScenario] = useState("Normal Seasonal Rain");
  const [soilType, setSoilType] = useState("Black Cotton Clay");
  const [areaAcres, setAreaAcres] = useState(2.0);
  const [yieldResult, setYieldResult] = useState(null);
  const [yieldLoading, setYieldLoading] = useState(false);
  const [yieldError, setYieldError] = useState("");

  // 2) Crop ROI & Season Profitability Simulator State (Same as AI Advisor)
  const [roiCrop, setRoiCrop] = useState("Soybean");
  const [seedType, setSeedType] = useState("hyv");
  const [budget, setBudget] = useState(50000);
  const [acreage, setAcreage] = useState(2.0);
  const [roiResult, setRoiResult] = useState(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [roiError, setRoiError] = useState("");

  useEffect(() => {
    if (user?.id) {
      api
        .listFarms(user.id)
        .then((f) => {
          const farmList = Array.isArray(f) ? f : [];
          setFarms(farmList);
          if (farmList.length > 0) {
            setSelectedFarmId(farmList[0].id);
            if (farmList[0].area_acres) {
              setAreaAcres(farmList[0].area_acres);
              setAcreage(farmList[0].area_acres);
            }
            if (farmList[0].crop) {
              setRoiCrop(farmList[0].crop);
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);

  // Run GenAI Yield Prediction
  const handlePredictYield = async () => {
    if (!selectedFarmId) return;
    setYieldLoading(true);
    setYieldError("");
    const activeLang = i18n.language || user?.language || "en";

    try {
      const res = await api.predictYield(selectedFarmId, {
        crop: selectedFarm?.crop || "Sugarcane",
        area_acres: Number(areaAcres),
        fertilizer_mode: fertilizerMode,
        water_mode: waterMode,
        weather_scenario: weatherScenario,
        soil_type: soilType,
        language: activeLang,
      });
      setYieldResult(res);
    } catch (err) {
      setYieldError(err.message || "Failed to generate yield prediction.");
    } finally {
      setYieldLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "yield" && selectedFarmId && !yieldResult) {
      handlePredictYield();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedFarmId]);

  // Run ROI Simulation (Same Engine & Method as AI Advisor)
  const runRoiSimulation = () => {
    setRoiLoading(true);
    setRoiError("");
    const activeLang = i18n.language || user?.language || "en";
    api
      .simulateCropRoi({
        crop: roiCrop,
        seedType,
        budget,
        acreage,
        farmId: selectedFarmId || null,
        language: activeLang,
      })
      .then(setRoiResult)
      .catch((err) => setRoiError(err.message || "Failed to run ROI simulation."))
      .finally(() => setRoiLoading(false));
  };

  useEffect(() => {
    if (activeTab === "roi" && !roiResult) {
      runRoiSimulation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("yield_predictor.title", "GenAI Crop Yield & Profitability Predictor")}
      subtitle={t(
        "yield_predictor.subtitle",
        "Forecast seasonal harvest volume, analyze yield drivers, and simulate farm cultivation ROI & net profit margins."
      )}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Farm Selector Banner */}
        {farms.length > 0 && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ACTIVE PLOT TELEMETRY
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedFarm?.farm_name || "Primary Farm"} &middot; {selectedFarm?.crop || "Sugarcane"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Switch Field:</label>
              <select
                value={selectedFarmId}
                onChange={(e) => {
                  setSelectedFarmId(e.target.value);
                  const f = farms.find((farm) => farm.id === e.target.value);
                  if (f?.area_acres) {
                    setAreaAcres(f.area_acres);
                    setAcreage(f.area_acres);
                  }
                  if (f?.crop) {
                    setRoiCrop(f.crop);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-emerald-600"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    🌾 {f.farm_name} ({f.crop}) &middot; {f.area_acres || 2.0} Acres
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("yield")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "yield"
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-300" />
            🌾 GenAI Crop Yield & Harvest Predictor
          </button>

          <button
            onClick={() => setActiveTab("roi")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "roi"
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            🌱 Season ROI & Profitability Simulator
          </button>
        </div>

        {/* TAB 1: GENAI CROP YIELD & HARVEST PREDICTOR */}
        {activeTab === "yield" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Input Controls Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-600" />
                    Crop Yield Predictive Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Combine Earth Engine satellite telemetry with agronomic input variables.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Groq Llama-3 AI Engine
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fertilizer */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Fertilizer & Nutrition Dosage:
                  </label>
                  <select
                    value={fertilizerMode}
                    onChange={(e) => setFertilizerMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-emerald-600"
                  >
                    {FERTILIZER_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Irrigation */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" /> Irrigation System:
                  </label>
                  <select
                    value={waterMode}
                    onChange={(e) => setWaterMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-emerald-600"
                  >
                    {WATER_OPTIONS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weather */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-orange-500" /> Weather & Monsoon Climate Shift:
                  </label>
                  <select
                    value={weatherScenario}
                    onChange={(e) => setWeatherScenario(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-emerald-600"
                  >
                    {WEATHER_OPTIONS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Soil Profile */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700" /> Soil Profile Type:
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-emerald-600"
                  >
                    {SOIL_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-48 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Cultivation Area (Acres):</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  />
                </div>

                <div className="flex-1 flex justify-end items-end pt-5">
                  <button
                    onClick={handlePredictYield}
                    disabled={yieldLoading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {yieldLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Simulating Field Microclimate...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        🔮 Predict Harvest Yield
                      </>
                    )}
                  </button>
                </div>
              </div>

              {yieldError && <p className="text-xs font-bold text-red-600">{yieldError}</p>}
            </div>

            {/* Yield Prediction Results */}
            {yieldResult && (
              <div className="space-y-5">
                {/* 4 Primary KPI Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Predicted Yield
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {yieldResult.predicted_yield_qtl_per_acre} <span className="text-xs font-medium">Qtl/acre</span>
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700">
                      Total: {yieldResult.total_yield_qtl} Qtl
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Yield Variation
                    </span>
                    <div
                      className={`text-2xl font-extrabold ${
                        yieldResult.yield_change_pct >= 0 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {yieldResult.yield_change_pct >= 0 ? "+" : ""}
                      {yieldResult.yield_change_pct}%
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">vs Baseline Norm</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Gross Revenue Range
                    </span>
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{(yieldResult.revenue_min_inr / 1000).toFixed(0)}k - ₹
                      {(yieldResult.revenue_max_inr / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">Current Market Price</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      AI Confidence
                    </span>
                    <div className="text-2xl font-extrabold text-purple-700">
                      {yieldResult.confidence_pct}%
                    </div>
                    <div className="text-[11px] font-semibold text-purple-600">Model Accuracy</div>
                  </div>
                </div>

                {/* Executive Summary Banner */}
                <div className="p-4 rounded-2xl bg-emerald-900/10 border border-emerald-500/30 text-emerald-950 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" /> Executive Yield Forecast Summary:
                  </div>
                  <p className="text-xs leading-relaxed font-medium text-slate-800">
                    {yieldResult.summary}
                  </p>
                </div>

                {/* Factors & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-slate-600" /> Key Yield Drivers:
                    </h4>
                    <ul className="space-y-2">
                      {yieldResult.key_drivers?.map((driver, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-emerald-500/30 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Maximization Recommendations:
                    </h4>
                    <ul className="space-y-2">
                      {yieldResult.recommendations?.map((rec, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-700 font-bold">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: SEASON ROI & PROFITABILITY SIMULATOR (EXACT SAME AS AI ADVISOR) */}
        {activeTab === "roi" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Inputs Form Card */}
            <div className="card" style={{ marginBottom: "1.5rem", background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 800, color: "var(--canopy)" }}>
                    {t("advisor.roi_title", "Crop ROI & Season Profitability Simulator")}
                  </h3>
                  <p style={{ color: "#6b6455", margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                    {t("advisor.roi_subtitle", "Simulate yield, input costs, and projected revenue under 3 weather scenarios before sowing.")}
                  </p>
                </div>
                <span className="badge badge-healthy" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles style={{ width: 14, height: 14 }} /> Pre-Sowing AI Engine
                </span>
              </div>

              <div className="grid grid-4" style={{ alignItems: "end", gap: "1rem" }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "0.82rem" }}>{t("advisor.crop", "Crop")}</label>
                  <select value={roiCrop} onChange={(e) => setRoiCrop(e.target.value)}>
                    {CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "0.82rem" }}>{t("advisor.seed_type", "Seed Variety")}</label>
                  <select value={seedType} onChange={(e) => setSeedType(e.target.value)}>
                    {SEED_TYPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "0.82rem" }}>{t("advisor.budget", "Budget (₹)")}</label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                </div>

                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: "0.82rem" }}>{t("advisor.acreage", "Acreage (Acres)")}</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={acreage}
                    onChange={(e) => setAcreage(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.2rem" }}>
                <button
                  className="btn-primary"
                  onClick={runRoiSimulation}
                  disabled={roiLoading}
                  style={{ padding: "0.7rem 1.8rem", fontSize: "0.95rem" }}
                >
                  {roiLoading ? t("advisor.simulating", "Simulating Season...") : t("advisor.simulate_btn", "⚡ Run Season Simulation")}
                </button>
              </div>
            </div>

            {roiError && <p style={{ color: "var(--stress)", fontWeight: 600 }}>{roiError}</p>}

            {/* ROI Simulator Results View */}
            {roiResult && (
              <>
                {/* Overall AI Feasibility Banner */}
                <div
                  className="card"
                  style={{
                    marginBottom: "1.5rem",
                    background: roiResult.feasibility === "FEASIBLE" ? "rgba(77,112,66,0.09)" : "rgba(220,100,50,0.09)",
                    borderColor: roiResult.feasibility === "FEASIBLE" ? "var(--canopy)" : "rgba(220,100,50,0.4)",
                    padding: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 800 }}>{roiResult.feasibility_title}</h3>
                      <p style={{ margin: "0.3rem 0 0", fontSize: "0.88rem", color: "#555" }}>
                        Crop: <strong>{roiResult.crop}</strong> ({roiResult.seed_type_name}) | Acreage: <strong>{roiResult.acreage} Acres</strong> | Budget: <strong>₹{(roiResult.user_budget || 0).toLocaleString()}</strong>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div className="stat-tile" style={{ padding: "0.5rem 1rem", textAlign: "center", background: "#ffffff" }}>
                        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#6b6455", fontWeight: 700 }}>Suitability Score</div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--canopy)" }}>{roiResult.suitability_score} / 100</div>
                      </div>
                      <div className="stat-tile" style={{ padding: "0.5rem 1rem", textAlign: "center", background: "#ffffff" }}>
                        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#6b6455", fontWeight: 700 }}>Break-Even Price</div>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--soil)" }}>₹{(roiResult.break_even_price_per_qtl || 0).toLocaleString()}/Qtl</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Weather Scenarios Comparison Grid */}
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "1rem", color: "var(--soil)" }}>
                  {t("advisor.scenario_comparison", "3-Weather Scenario Simulation Comparison")}
                </h3>

                <div className="grid grid-3" style={{ gap: "1.2rem", marginBottom: "1.5rem" }}>
                  {roiResult.scenarios?.map((sc) => {
                    const isPositive = (sc.net_profit || 0) >= 0;
                    return (
                      <div
                        key={sc.id}
                        className="card"
                        style={{
                          position: "relative",
                          border: sc.id === "normal" ? "2px solid var(--canopy)" : "1px solid #e0dcd3",
                          background: sc.id === "normal" ? "rgba(255,255,255,0.95)" : "#fcfbf8",
                        }}
                      >
                        {sc.id === "normal" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "-12px",
                              right: "16px",
                              background: "var(--canopy)",
                              color: "#fff",
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              padding: "2px 10px",
                              borderRadius: "12px",
                            }}
                          >
                            PRIMARY BASELINE
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "1.5rem" }}>{sc.icon}</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>{sc.name}</h4>
                            <span
                              className={`badge ${
                                sc.risk_level === "LOW"
                                  ? "badge-healthy"
                                  : sc.risk_level === "MODERATE"
                                  ? "badge-stressed"
                                  : "badge-sold"
                              }`}
                              style={{ marginTop: "4px", fontSize: "0.7rem" }}
                            >
                              {sc.risk_badge} ({sc.roi_percentage}%)
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: "0.8rem", color: "#6b6455", margin: "0.4rem 0 1rem", lineHeight: 1.4 }}>
                          {sc.description}
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
                          <div className="stat-tile" style={{ padding: "0.6rem", background: "#f5f3ec" }}>
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>{t("advisor.expected_yield", "Expected Yield")}</div>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--soil)" }}>
                              {sc.yield_per_acre_qtl} <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>Qtl/acre</span>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>Total: {sc.total_yield_qtl} Qtl</div>
                          </div>

                          <div className="stat-tile" style={{ padding: "0.6rem", background: "#f5f3ec" }}>
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>{t("advisor.input_cost", "Total Input Cost")}</div>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: sc.is_budget_sufficient ? "var(--soil)" : "#c0392b" }}>
                              ₹{(sc.total_input_cost || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>₹{(sc.input_cost_per_acre || 0).toLocaleString()}/acre</div>
                          </div>

                          <div className="stat-tile" style={{ padding: "0.6rem", background: "#f5f3ec" }}>
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>{t("advisor.gross_revenue", "Gross Revenue")}</div>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--soil)" }}>
                              ₹{(sc.gross_revenue || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>@ ₹{sc.mandi_price_per_qtl}/Qtl</div>
                          </div>

                          <div
                            className="stat-tile"
                            style={{
                              padding: "0.6rem",
                              background: isPositive ? "rgba(77,112,66,0.12)" : "rgba(220,50,50,0.12)",
                              borderColor: isPositive ? "var(--canopy)" : "#e74c3c",
                            }}
                          >
                            <div style={{ fontSize: "0.72rem", color: "#6b6455" }}>{t("advisor.net_profit", "Net Profit")}</div>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: isPositive ? "var(--canopy)" : "#c0392b" }}>
                              {isPositive ? "+" : ""}₹{(sc.net_profit || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: isPositive ? "var(--canopy)" : "#c0392b" }}>
                              ₹{(sc.profit_per_acre || 0).toLocaleString()}/acre
                            </div>
                          </div>
                        </div>

                        {/* Cost Breakdown */}
                        {sc.cost_breakdown && (
                          <div style={{ background: "#ffffff", padding: "0.75rem", borderRadius: "10px", border: "1px solid #e8e4d9" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--soil)" }}>
                              {t("advisor.cost_breakdown_title", "Input Expense Breakdown (Total)")}:
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>🌱 {t("advisor.seed_cost", "Seed")}:</span>
                                <strong>₹{(sc.cost_breakdown.seed || 0).toLocaleString()}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>🧪 {t("advisor.fertilizer_cost", "Fertilizers")}:</span>
                                <strong>₹{(sc.cost_breakdown.fertilizer || 0).toLocaleString()}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>💧 {t("advisor.water_cost", "Irrigation")}:</span>
                                <strong>₹{(sc.cost_breakdown.water_irrigation || 0).toLocaleString()}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>🛡️ {t("advisor.pesticide_cost", "Pest Care")}:</span>
                                <strong>₹{(sc.cost_breakdown.pesticide_care || 0).toLocaleString()}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>🚜 {t("advisor.labor_cost", "Labor & Machines")}:</span>
                                <strong>₹{(sc.cost_breakdown.labor_machinery || 0).toLocaleString()}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* AI Risk Mitigation & Strategy Card */}
                {roiResult.mitigation_tips && roiResult.mitigation_tips.length > 0 && (
                  <div className="card" style={{ background: "rgba(77,112,66,0.08)", borderColor: "var(--canopy)", marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.05rem", marginBottom: "0.8rem", color: "var(--canopy)", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShieldCheck style={{ width: 20, height: 20 }} /> {t("advisor.ai_verdict", "AI Sowing Feasibility & Risk Mitigation Strategy")}
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--soil)", fontSize: "0.9rem", lineHeight: 1.8 }}>
                      {roiResult.mitigation_tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
