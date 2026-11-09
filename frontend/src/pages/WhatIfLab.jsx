import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Zap, RefreshCw, ChevronDown, Check } from "lucide-react";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";

export default function WhatIfLab({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t, i18n } = useTranslation();

  // Scenario Simulator State
  const [scenario, setScenario] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const presetDropdownRef = useRef(null);

  // Close preset dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(e.target)) {
        setShowPresetDropdown(false);
      }
    };
    if (showPresetDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showPresetDropdown]);

  // Farm Selection
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");

  useEffect(() => {
    if (user?.id) {
      api
        .listFarms(user.id)
        .then((f) => {
          setFarms(f || []);
          if (f && f.length > 0) {
            setSelectedFarmId(f[0].id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSimulate = async () => {
    if (!scenario.trim()) return;
    if (!selectedFarmId) {
      setOutcome(t("what_if.no_farm_alert", "You need to register a farm first to run simulations."));
      return;
    }
    setLoading(true);
    setOutcome("");
    try {
      const activeLang = i18n.language || user?.language || "en";
      const res = await api.simulateScenario(selectedFarmId, scenario, activeLang);
      setOutcome(res.outcome);
    } catch {
      setOutcome(t("what_if.error_failed", "Failed to run simulation. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);

  const presets = [
    { icon: "🌧️", text: t("what_if.preset1", "What if rainfall increases by 25%?") },
    { icon: "🧪", text: t("what_if.preset2", "What if I apply urea today?") },
    { icon: "🌾", text: t("what_if.preset3", "What if I harvest 1 week early?") },
    { icon: "☀️", text: t("what_if.preset4", "What if a 3-day dry spell occurs next week?") },
    { icon: "💧", text: t("what_if.preset5", "What if I switch from flood irrigation to drip irrigation?") },
    { icon: "🌿", text: t("what_if.preset6", "What if I spray neem oil for preventive pest control?") },
    { icon: "🌡️", text: t("what_if.preset7", "What if temperature rises above 38°C during flowering?") },
  ];

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("what_if.title", "AI What-If Simulation")}
      subtitle={t("what_if.subtitle", "Test farm decisions before you make them with AI predictive analytics")}
    >
      {/* 12-COLUMN UNIFIED BENTO GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: "1.5rem",
          alignItems: "stretch",
          marginBottom: "1.5rem",
        }}
      >
        {/* Left Column: Farm Selector, Query Prompt & Presets (Spans 6 columns) */}
        <div
          className="card"
          style={{
            gridColumn: "span 6",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "1.5rem",
          }}
        >
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.25rem" }}>🧪</span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--soil)", margin: 0 }}>
                  Scenario Parameter Config
                </h3>
              </div>
              <span className="badge" style={{ background: "var(--clay-bg)", color: "var(--farm-emerald)", fontSize: "0.72rem" }}>
                AI Decision Engine
              </span>
            </div>

            {/* Farm Selector Pill */}
            {farms.length === 0 ? (
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "16px",
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-inset-sm)",
                  color: "var(--amber)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  marginBottom: "1.2rem",
                }}
              >
                ⚠️ {t("what_if.no_farm", "No Farm Found. Please register a farm first from the Dashboard.")}
              </div>
            ) : (
              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--sage-mid)", marginBottom: "6px", display: "block" }}>
                  {t("dashboard.select_farm", "TARGET FARM PARCEL")}:
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "16px",
                    border: "none",
                    background: "var(--clay-surface)",
                    boxShadow: "var(--clay-inset-sm)",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    color: "var(--soil)",
                    outline: "none",
                  }}
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      🌾 {f.farm_name} ({f.crop}) &middot; {f.area_acres || 2.0} Acres
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Query Prompt Input */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--sage-mid)", marginBottom: "6px", display: "block" }}>
                HYPOTHETICAL ACTION / "WHAT IF" DECISION:
              </label>
              <textarea
                rows={3}
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSimulate();
                  }
                }}
                placeholder={t("what_if.placeholder", "e.g. What if I delay irrigation by 3 days? Or apply 20kg Urea now?")}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "18px",
                  border: "none",
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-inset)",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "var(--soil)",
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            {/* Popular Preset Scenarios Dropdown Menu */}
            <div ref={presetDropdownRef} style={{ position: "relative", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--sage-mid)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                  {t("what_if.popular_presets", "POPULAR PRESETS / SCENARIOS:")}
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--farm-emerald)", fontWeight: 700 }}>
                  7 Curated Options
                </span>
              </div>

              {/* Dropdown Selector Button */}
              <button
                type="button"
                onClick={() => setShowPresetDropdown((prev) => !prev)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.8rem 1rem",
                  borderRadius: "16px",
                  border: "none",
                  background: "var(--clay-surface)",
                  boxShadow: showPresetDropdown ? "var(--clay-inset-sm)" : "var(--clay-card-shadow-sm)",
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--soil)",
                  transition: "all 0.18s ease",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span>💡</span>
                  <span style={{ color: scenario ? "var(--soil)" : "var(--sage-mid)" }}>
                    {scenario && presets.some((p) => p.text === scenario)
                      ? scenario
                      : "Choose a quick preset or type your own..."}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-800 transition-transform duration-200 flex-shrink-0 ${
                    showPresetDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Floating Dropdown Menu Card */}
              {showPresetDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "var(--clay-surface)",
                    borderRadius: "20px",
                    boxShadow: "var(--clay-card-shadow-lg)",
                    padding: "8px",
                    zIndex: 100,
                    maxHeight: "260px",
                    overflowY: "auto",
                    border: "none",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  {presets.map((s, idx) => {
                    const isSelected = scenario === s.text;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setScenario(s.text);
                          setShowPresetDropdown(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.7rem 0.9rem",
                          borderRadius: "14px",
                          border: "none",
                          background: isSelected
                            ? "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))"
                            : "transparent",
                          color: isSelected ? "#ffffff" : "var(--soil)",
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: "0.82rem",
                          boxShadow: isSelected ? "var(--clay-card-shadow-sm)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          marginBottom: "3px",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "var(--clay-bg-lighter)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.05rem" }}>{s.icon}</span>
                          <span>{s.text}</span>
                        </div>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-700 opacity-40 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={loading || !scenario.trim() || farms.length === 0}
            onClick={handleSimulate}
            style={{
              width: "100%",
              marginTop: "1.4rem",
              padding: "0.85rem 1.4rem",
              borderRadius: "18px",
              cursor: loading || !scenario.trim() || farms.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t("dashboard.simulating", "Simulating Decision Impact...")}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>{t("what_if.simulate", "Run Simulation")}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Simulated Outcome & Risk Assessment (Spans 6 columns) */}
        <div
          className="card"
          style={{
            gridColumn: "span 6",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "1.5rem",
          }}
        >
          {outcome ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--sage-mid)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Simulation Result
                    </span>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--soil)", margin: "2px 0 0" }}>
                      Predicted Agro-Economic Impact
                    </h3>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: "linear-gradient(135deg, #b4d9c0, #c8e8d0)",
                      color: "#1a4a2e",
                      fontSize: "0.78rem",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      border: "none",
                    }}
                  >
                    AI Forecast
                  </span>
                </div>

                {/* Selected Farm context tag */}
                {selectedFarm && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--clay-bg)", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, color: "var(--farm-emerald)", marginBottom: "1rem" }}>
                    <span>📍</span> Field: {selectedFarm.farm_name} ({selectedFarm.crop}) &middot; {selectedFarm.area_acres || 0.32} Acres
                  </div>
                )}

                {/* Outcome Display Box */}
                <div
                  style={{
                    background: "var(--clay-surface)",
                    boxShadow: "var(--clay-inset-sm)",
                    borderRadius: "18px",
                    padding: "1.1rem 1.25rem",
                    fontSize: "0.88rem",
                    color: "var(--soil)",
                    lineHeight: 1.6,
                    fontWeight: 600,
                    whiteSpace: "pre-wrap",
                    marginBottom: "1.2rem",
                  }}
                >
                  {outcome}
                </div>
              </div>

              {/* Action follow-ups */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-sky"
                  style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.84rem", fontWeight: 800, borderRadius: "16px" }}
                  onClick={() => {
                    const event = new CustomEvent("agrimitra:open", {
                      detail: { question: `In my What-If Simulation for "${scenario}", the result was: "${outcome}". How should I optimize my schedule accordingly?` },
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  💬 Ask AgriMitra AI
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, padding: "0.75rem 1rem", fontSize: "0.84rem", fontWeight: 800, borderRadius: "16px" }}
                  onClick={() => {
                    setScenario("");
                    setOutcome("");
                  }}
                >
                  🔄 New Simulation
                </button>
              </div>
            </div>
          ) : (
            /* Standby Guide when no simulation has been run */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "360px",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  marginBottom: "1rem",
                }}
              >
                🔮
              </div>
              <h4 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--soil)", marginBottom: "0.4rem" }}>
                Predictive Agronomic Twin
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--sage-mid)", fontWeight: 600, maxWidth: "340px", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                Test any farming decision virtually against your farm's real soil composition, crop phenology, and upcoming weather patterns before executing in the field.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  width: "100%",
                  maxWidth: "360px",
                }}
              >
                <div style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-inset-sm)", borderRadius: "14px", padding: "0.75rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--soil)" }}>
                  📉 Risk Mitigation
                </div>
                <div style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-inset-sm)", borderRadius: "14px", padding: "0.75rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--soil)" }}>
                  🌾 Yield Impact
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
