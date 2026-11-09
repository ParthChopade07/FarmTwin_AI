import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import { CROPS } from "../utils/constants.js";
import { useTranslation } from "react-i18next";
import {
  Leaf, Upload, Sparkles, ShieldCheck, Zap, Clock, MapPin,
  RefreshCw, ArrowUpRight, CheckCircle2, AlertTriangle,
} from "lucide-react";

const STATUS_CONFIG = {
  Healthy: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", dot: "bg-emerald-500" },
  "At Risk": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", dot: "bg-amber-500" },
  Diseased: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", dot: "bg-red-500" },
};

export default function DiseaseDetection({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t, i18n } = useTranslation();

  const [screeningCrop, setScreeningCrop] = useState("Sugarcane");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [farms, setFarms] = useState([]);
  const [pinnedToMap, setPinnedToMap] = useState(false);

  useEffect(() => {
    api.getDiseaseHistory(user.id).then(setHistory).catch(() => {});
    api.listFarms(user?.id).then((data) => {
      if (data && data.length > 0) {
        setFarms(data);
        setSelectedFarmId(data[0].id);
        if (data[0].crop) setScreeningCrop(data[0].crop);
      }
    }).catch(() => {});
  }, [user.id]);

  const captureGPS = () => {
    if (!navigator.geolocation) { setGpsStatus("denied"); return; }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGpsStatus("success"); },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const pickFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError(""); setPinnedToMap(false);
    setPreview(URL.createObjectURL(f));
    captureGPS();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setPinnedToMap(false); setError("");
    try {
      const activeLang = i18n.language || user?.language || "en";
      const res = await api.detectDisease({
        file, crop: screeningCrop, userId: user.id,
        farmId: selectedFarmId || null, language: activeLang,
        lat: gpsCoords?.lat || null, lon: gpsCoords?.lon || null,
      });
      setResult(res);
      setHistory((h) => [res, ...h]);
      if (gpsCoords && selectedFarmId) setPinnedToMap(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusCfg = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG["At Risk"]) : null;

  const inputStyle = {
    background: "rgba(255,255,255,0.8)",
    boxShadow: "var(--clay-inset-sm)",
    border: "1px solid rgba(255,255,255,0.6)",
  };

  return (
    <AppShell
      user={user} role={role} onSwitchRole={onSwitchRole}
      onLogout={onLogout} onLanguageChange={onLanguageChange}
      title={t("disease.title", "AI Crop Disease Detection")}
      subtitle={t("disease.subtitle", "Upload a leaf photo for instant AI pathogen diagnosis, prescription & geo-tagged field mapping.")}
    >
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── MAIN 2-COLUMN SCANNER ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left: Upload + Config */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "var(--clay-surface)",
              boxShadow: "var(--clay-card-shadow)",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderBottom: "1px solid rgba(110,231,183,0.3)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}>
                  <Leaf className="w-4.5 h-4.5 text-white" style={{ width: "18px", height: "18px" }} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Crop Leaf Scanner</h3>
                  <p className="text-[10px] font-bold text-emerald-700">PlantVillage Vision AI · 54K+ Disease Images</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Groq Vision
              </span>
            </div>

            <div className="p-5 flex flex-col gap-4 flex-1">
              {/* Crop + Farm selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">🌾 Target Crop</label>
                  <select value={screeningCrop} onChange={(e) => setScreeningCrop(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    style={inputStyle}>
                    {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {farms.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">📍 Link to Farm</label>
                    <select value={selectedFarmId || ""} onChange={(e) => setSelectedFarmId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      style={inputStyle}>
                      {farms.map((f) => <option key={f.id} value={f.id}>🌾 {f.farm_name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Drop zone */}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                className={`relative rounded-2xl cursor-pointer transition-all flex items-center justify-center overflow-hidden ${dragOver ? "scale-[1.01]" : ""}`}
                style={{
                  minHeight: "180px",
                  border: `2px dashed ${dragOver ? "#059669" : "rgba(110,231,183,0.5)"}`,
                  background: dragOver ? "rgba(236,253,245,0.6)" : "rgba(255,255,255,0.5)",
                  boxShadow: "var(--clay-inset-sm)",
                }}
              >
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files[0])} />
                {preview ? (
                  <div className="relative w-full h-full">
                    <img src={preview} alt="leaf" className="w-full h-44 object-cover" />
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/90 text-emerald-700 border border-emerald-200 shadow-sm">
                        ✓ Click or drop another image to change
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1" style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)" }}>
                      <Upload className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-sm font-black text-slate-700">{t("disease.dropzone_text", "Click or drag & drop leaf image")}</div>
                    <div className="text-xs text-slate-500 font-semibold">{t("disease.dropzone_sub", "JPEG, PNG, WEBP — Max 10MB")}</div>
                  </div>
                )}
              </div>

              {/* GPS Status */}
              {file && (
                <div className="flex items-center gap-2 flex-wrap">
                  {gpsStatus === "locating" && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Capturing GPS...
                    </span>
                  )}
                  {gpsStatus === "success" && gpsCoords && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> GPS Locked: {gpsCoords.lat.toFixed(4)}°N, {gpsCoords.lon.toFixed(4)}°E
                    </span>
                  )}
                  {gpsStatus === "denied" && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                      ⚠️ GPS unavailable — scan saved without map pin
                    </span>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Pinned success */}
              <AnimatePresence>
                {pinnedToMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Real detection pinned on Farm Twin map! Dashboard → 🐛 Pests & Weeds to view it.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze Button */}
              <motion.button
                whileHover={{ scale: file && !loading ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="w-full py-3.5 rounded-2xl text-white text-sm font-black transition-all flex items-center justify-center gap-2 mt-auto"
                style={{
                  background: !file || loading
                    ? "rgba(100,116,139,0.4)"
                    : "linear-gradient(135deg, #065f46, #059669)",
                  boxShadow: !file || loading ? "none" : "0 4px 16px rgba(5,150,105,0.3)",
                  cursor: !file || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t("disease.btn_analyzing", "Analyzing Leaf Pathogens...")}</>
                  : <><Sparkles className="w-4 h-4" /> {t("disease.btn_diagnose", "Scan & Diagnose Plant Disease")}</>
                }
              </motion.button>
            </div>
          </motion.div>

          {/* Right: Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "var(--clay-surface)",
              boxShadow: "var(--clay-card-shadow)",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          >
            {result ? (
              <>
                {/* Result Header */}
                <div
                  className="px-5 py-4 flex items-start justify-between gap-3"
                  style={{
                    background: result.status === "Healthy"
                      ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                      : result.status === "Diseased"
                      ? "linear-gradient(135deg, #fff1f2, #fce7f3)"
                      : "linear-gradient(135deg, #fffbeb, #fef3c7)",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Detected Pathogen / Diagnosis
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">{result.disease_name}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      {screeningCrop} · {result.confidence_label || "High"} Confidence
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border shrink-0 flex items-center gap-1.5 ${statusCfg?.bg} ${statusCfg?.text} ${statusCfg?.border}`}>
                    <span className={`w-2 h-2 rounded-full ${statusCfg?.dot}`} />
                    {result.status}
                  </span>
                </div>

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Summary */}
                  {result.summary && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{result.summary}</p>
                  )}

                  {/* Confidence Bar */}
                  <div className="p-3.5 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}>
                    <div className="flex justify-between items-center text-xs font-black text-slate-700">
                      <span>{t("disease.confidence", "AI Confidence Score")}</span>
                      <span className="text-emerald-700">
                        {result.confidence_label === "High" ? "90–95%" : result.confidence_label === "Medium" ? "70–85%" : "50–65%"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/60 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: result.confidence_label === "High" ? "92%" : result.confidence_label === "Medium" ? "76%" : "58%" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #065f46, #34d399)" }}
                      />
                    </div>
                  </div>

                  {/* Treatment */}
                  {result.recommended_action && (
                    <div
                      className="p-4 rounded-2xl space-y-1.5"
                      style={{ background: "rgba(236,253,245,0.8)", border: "1px solid rgba(110,231,183,0.4)", borderLeft: "4px solid #059669" }}
                    >
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        🧪 {t("disease.recommended_treatment", "Recommended Treatment Protocol")}
                      </span>
                      <p className="text-xs text-slate-800 font-semibold leading-relaxed">{result.recommended_action}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-2">
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("agrimitra:open", { detail: { question: `My ${screeningCrop} is diagnosed with "${result.disease_name}". Treatment: "${result.recommended_action}". Give step-by-step application and organic alternatives.` } }))}
                      className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ background: "rgba(219,234,254,0.8)", color: "#1e40af", border: "1px solid rgba(147,197,253,0.6)", boxShadow: "var(--clay-card-shadow-sm)" }}
                    >
                      💬 Ask AgriMitra AI
                    </button>
                    <button
                      onClick={() => window.location.href = "/services"}
                      className="flex-1 py-2.5 px-3 rounded-2xl text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
                    >
                      🛸 Book Bio-Spray <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Standby State */
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-4 min-h-64">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                  style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow)" }}
                >
                  🔬
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800">Instant Plant Pathology Diagnosis</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1 max-w-xs leading-relaxed">
                    Select your crop, upload a clear photo of the infected leaf, and click <strong>Scan & Diagnose</strong>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                  {[
                    { emoji: "🌿", text: "92.9% Model Accuracy" },
                    { emoji: "⚡", text: "Instant Remediation" },
                    { emoji: "📍", text: "GPS Field Pinning" },
                    { emoji: "🔬", text: "PlantVillage Dataset" },
                  ].map(({ emoji, text }) => (
                    <div
                      key={text}
                      className="p-2.5 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
                    >
                      <span>{emoji}</span> {text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── SCAN HISTORY ── */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl space-y-4"
            style={{
              background: "var(--clay-surface)",
              boxShadow: "var(--clay-card-shadow)",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-black text-slate-900">{t("disease.history_title", "Recent Scan History")}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                {history.length} Scans
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.slice(0, 6).map((s, i) => {
                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["At Risk"];
                return (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-3.5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-card-shadow-sm)", border: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{s.disease_name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {s.crop || screeningCrop} · {s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent"}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
