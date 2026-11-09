import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  Sparkles,
  ExternalLink,
  FileText,
  Search,
  RefreshCw,
  IndianRupee,
  ShieldCheck,
  Zap,
  ChevronDown,
  CheckCircle2,
  ArrowUpRight,
  Sun,
  Sprout,
  BadgeCheck,
} from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";
import { CROPS } from "../utils/constants.js";

const INDIAN_STATES = [
  "Maharashtra","Madhya Pradesh","Gujarat","Uttar Pradesh","Punjab",
  "Haryana","Rajasthan","Karnataka","Andhra Pradesh","Telangana",
  "Tamil Nadu","Bihar","West Bengal","Odisha","Chhattisgarh",
];

const FARMER_CATEGORIES = [
  "Small & Marginal Farmer (< 2 Hectares)",
  "Medium Farmer (2 - 10 Hectares)",
  "Large Farmer (> 10 Hectares)",
  "Women Farmer (Special Subsidies)",
  "SC / ST Category Farmer",
  "FPO / Farmer Producer Group Member",
];

// Category badge color mapping
const BADGE_COLORS = {
  "DIRECT BANK TRANSFER": "bg-blue-100 text-blue-800 border-blue-200",
  "CROP LOSS RISK COVER": "bg-amber-100 text-amber-800 border-amber-200",
  "SUBSIDY": "bg-purple-100 text-purple-800 border-purple-200",
  "INSURANCE": "bg-orange-100 text-orange-800 border-orange-200",
  "SOLAR PUMP": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "FERTILIZER": "bg-lime-100 text-lime-800 border-lime-200",
  "DEFAULT": "bg-slate-100 text-slate-700 border-slate-200",
};

function getBadgeColor(badge) {
  const key = (badge || "").toUpperCase();
  for (const k of Object.keys(BADGE_COLORS)) {
    if (key.includes(k)) return BADGE_COLORS[k];
  }
  return BADGE_COLORS["DEFAULT"];
}

function SkeletonCard() {
  return (
    <div
      className="p-5 rounded-3xl space-y-4 animate-pulse"
      style={{
        background: "var(--clay-surface)",
        boxShadow: "var(--clay-card-shadow-sm)",
        border: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      <div className="flex justify-between">
        <div className="h-5 w-28 rounded-full bg-slate-200/80" />
        <div className="h-5 w-16 rounded-full bg-slate-200/80" />
      </div>
      <div className="h-5 w-3/4 rounded-lg bg-slate-200/80" />
      <div className="h-4 w-1/2 rounded-lg bg-slate-200/60" />
      <div className="h-16 rounded-2xl bg-emerald-100/60" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-9 rounded-xl bg-slate-200/60" />
        <div className="w-28 h-9 rounded-xl bg-emerald-200/60" />
      </div>
    </div>
  );
}

function StatsBar({ schemesResult }) {
  const count = schemesResult?.schemes?.length || 0;
  const totalBenefit = schemesResult?.schemes?.reduce((acc, s) => {
    const match = (s.benefit || "").match(/[\d,]+/);
    if (match) return acc + parseInt(match[0].replace(/,/g, ""), 10);
    return acc;
  }, 0);

  const stats = [
    { label: "Eligible Schemes", value: count, icon: ShieldCheck, color: "text-emerald-700", bg: "bg-emerald-100" },
    { label: "Max Annual Benefit", value: totalBenefit ? `₹${(totalBenefit / 1000).toFixed(0)}K+` : "–", icon: IndianRupee, color: "text-blue-700", bg: "bg-blue-100" },
    { label: "AI Match Engine", value: "Groq LLM", icon: Zap, color: "text-purple-700", bg: "bg-purple-100" },
    { label: "DBT Verified", value: "Govt. Portal", icon: BadgeCheck, color: "text-amber-700", bg: "bg-amber-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <motion.div
          key={s.label}
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl flex items-center gap-3"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow-sm)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
            <s.icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <div className="text-base font-black text-slate-900 leading-tight">{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SchemeCard({ sch, idx, schemeCrop, schemeAcreage, schemeState }) {
  const [expanded, setExpanded] = useState(false);
  const badgeColor = getBadgeColor(sch.category_badge);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.3 }}
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: "var(--clay-surface)",
        boxShadow: "var(--clay-card-shadow)",
        border: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      {/* Card Header Accent Strip */}
      <div
        className="h-1.5 w-full"
        style={{
          background: idx % 3 === 0
            ? "linear-gradient(90deg, #059669, #10b981)"
            : idx % 3 === 1
            ? "linear-gradient(90deg, #2563eb, #7c3aed)"
            : "linear-gradient(90deg, #d97706, #f59e0b)",
        }}
      />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}>
            {sch.category_badge || "Central / State DBT"}
          </span>
          <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {sch.match_score || "High Match"}
          </span>
        </div>

        {/* Title */}
        <div>
          <h4 className="text-sm font-black text-slate-900 leading-snug">{sch.name}</h4>
          <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
            <Landmark className="w-3 h-3 shrink-0" />
            {sch.authority}
          </p>
        </div>

        {/* Benefit Banner */}
        <div
          className="p-3.5 rounded-2xl flex items-start gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(236,253,245,0.9), rgba(209,250,229,0.7))",
            border: "1px solid rgba(110,231,183,0.5)",
          }}
        >
          <IndianRupee className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
              Financial Grant / Subsidy Benefit
            </span>
            <span className="text-sm font-black text-emerald-900 leading-snug">{sch.benefit}</span>
          </div>
        </div>

        {/* Eligibility */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          <strong className="text-slate-800">Eligibility: </strong>{sch.eligibility}
        </p>

        {/* Expandable: Documents */}
        {sch.documents && sch.documents.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Required Documents ({sch.documents.length})
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {sch.documents.map((doc, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        {doc}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        className="px-5 py-3 flex gap-2 border-t"
        style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.5)" }}
      >
        <button
          onClick={() => {
            const event = new CustomEvent("agrimitra:open", {
              detail: {
                question: `I want to apply for the "${sch.name}" scheme for my ${schemeAcreage} acres in ${schemeState}. What is the exact step-by-step application procedure and nearest office?`,
              },
            });
            window.dispatchEvent(event);
          }}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
          style={{
            background: "rgba(255,255,255,0.8)",
            boxShadow: "var(--clay-card-shadow-sm)",
            color: "#1e40af",
            border: "1px solid rgba(191,219,254,0.8)",
          }}
        >
          💬 Ask AgriMitra
        </button>

        {sch.application_url && (
          <a
            href={sch.application_url}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
          >
            Apply <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function GovernmentSchemes({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t, i18n } = useTranslation();

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [schemeCrop, setSchemeCrop] = useState("Sugarcane");
  const [schemeState, setSchemeState] = useState(user?.state || "Maharashtra");
  const [schemeCategory, setSchemeCategory] = useState("Small & Marginal Farmer (< 2 Hectares)");
  const [schemeAcreage, setSchemeAcreage] = useState(2.0);

  const [schemesResult, setSchemesResult] = useState(null);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [schemesError, setSchemesError] = useState("");

  useEffect(() => {
    if (user?.id) {
      api.listFarms(user.id).then((f) => {
        setFarms(f || []);
        if (f && f.length > 0) {
          setSelectedFarmId(f[0].id);
          if (f[0].crop) setSchemeCrop(f[0].crop);
          if (f[0].area_acres) setSchemeAcreage(f[0].area_acres);
        }
      }).catch(() => {});
    }
  }, [user]);

  const fetchGovernmentSchemes = async () => {
    setSchemesLoading(true);
    setSchemesError("");
    const activeLang = i18n.language || user?.language || "en";
    try {
      const res = await api.getGovernmentSchemes({
        crop: schemeCrop,
        state: schemeState,
        acreage: Number(schemeAcreage),
        category: schemeCategory,
        language: activeLang,
      });
      setSchemesResult(res);
    } catch (err) {
      setSchemesError(err.message || "Failed to fetch government schemes.");
    } finally {
      setSchemesLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernmentSchemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeCrop, schemeState, schemeCategory]);

  const selectClass = "w-full px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer";
  const selectStyle = {
    background: "rgba(255,255,255,0.8)",
    boxShadow: "var(--clay-inset-sm)",
    border: "1px solid rgba(255,255,255,0.6)",
  };

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("schemes.title", "Government Scheme Advisor")}
      subtitle={t("schemes.subtitle", "AI-matched Central & State subsidies, PM-Kisan grants, crop insurance, and solar pump schemes.")}
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── HERO FILTER CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderBottom: "1px solid rgba(110,231,183,0.3)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 4px 12px rgba(5,150,105,0.35)" }}
              >
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Government Subsidy & Scheme Matching</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Direct Benefit Transfer (DBT) eligibility • Crop × Region × Landholding
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 bg-purple-100 text-purple-800 border border-purple-200">
                <Zap className="w-3.5 h-3.5" /> Groq LLM Engine
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                <BadgeCheck className="w-3.5 h-3.5" /> Govt. Verified
              </span>
            </div>
          </div>

          {/* Filter Grid */}
          <div className="p-6 space-y-4">
            {/* Farm quick-select */}
            {farms.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.6)", boxShadow: "var(--clay-inset-sm)" }}>
                <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-black text-slate-600 shrink-0">Your Farm:</span>
                <select
                  value={selectedFarmId}
                  onChange={(e) => {
                    setSelectedFarmId(e.target.value);
                    const f = farms.find((fm) => fm.id === e.target.value);
                    if (f) {
                      if (f.crop) setSchemeCrop(f.crop);
                      if (f.area_acres) setSchemeAcreage(f.area_acres);
                    }
                  }}
                  className="flex-1 bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>🌾 {f.farm_name} — {f.crop} ({f.area_acres?.toFixed(2) || "?"} ac)</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Crop */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">🌾 Target Crop</label>
                <select value={schemeCrop} onChange={(e) => setSchemeCrop(e.target.value)} className={selectClass} style={selectStyle}>
                  {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* State */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">📍 State / Territory</label>
                <select value={schemeState} onChange={(e) => setSchemeState(e.target.value)} className={selectClass} style={selectStyle}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">👤 Farmer Category</label>
                <select value={schemeCategory} onChange={(e) => setSchemeCategory(e.target.value)} className={selectClass} style={selectStyle}>
                  {FARMER_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {/* Acreage */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">📐 Land Area (Acres)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={schemeAcreage}
                  onChange={(e) => setSchemeAcreage(Number(e.target.value))}
                  className={selectClass}
                  style={selectStyle}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-end pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchGovernmentSchemes}
                disabled={schemesLoading}
                className="py-3 px-7 rounded-2xl text-white font-black text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 4px 16px rgba(5,150,105,0.35)" }}
              >
                {schemesLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning Govt. Portals...</>
                ) : (
                  <><Search className="w-4 h-4" /> Find Eligible Schemes with AI</>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── ERROR ── */}
        {schemesError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            ⚠️ {schemesError}
          </div>
        )}

        {/* ── LOADING SKELETONS ── */}
        {schemesLoading && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/60 animate-pulse" style={{ boxShadow: "var(--clay-card-shadow-sm)" }} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!schemesLoading && schemesResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Stats Bar */}
            <StatsBar schemesResult={schemesResult} />

            {/* AI Summary Banner */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl flex items-start gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(236,253,245,0.95), rgba(220,252,231,0.8))",
                boxShadow: "var(--clay-card-shadow-sm)",
                border: "1px solid rgba(110,231,183,0.5)",
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span>AI Financial Subsidy Briefing</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[9px]">
                    {schemesResult.schemes?.length || 0} Schemes Found
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-semibold text-slate-700">
                  {schemesResult.overall_summary}
                </p>
              </div>
            </motion.div>

            {/* Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemesResult.schemes?.map((sch, idx) => (
                <SchemeCard
                  key={sch.id || idx}
                  sch={sch}
                  idx={idx}
                  schemeCrop={schemeCrop}
                  schemeAcreage={schemeAcreage}
                  schemeState={schemeState}
                />
              ))}
            </div>

            {/* Disclaimer Footer */}
            <div className="text-center text-[10px] text-slate-400 font-semibold py-2">
              ℹ️ Schemes matched by AI based on your farm profile. Always verify eligibility at the official government portal before applying.
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
