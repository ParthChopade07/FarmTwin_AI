import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import MandiMap from "../components/MandiMap.jsx";
import { CROPS } from "../utils/constants.js";
import { useTranslation } from "react-i18next";
import {
  TrendingUp, RefreshCw, ShoppingCart, Warehouse, Calendar,
  DollarSign, MapPin, Sparkles, BarChart3, ArrowUpRight, Store,
  Clock, Truck, Target, ChevronDown,
} from "lucide-react";

function MetroCard({ label, value, sub, icon: Icon, iconBg, iconColor, accent }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="p-5 rounded-3xl flex flex-col justify-between"
      style={{
        background: "var(--clay-surface)",
        boxShadow: "var(--clay-card-shadow-sm)",
        border: "1px solid rgba(255,255,255,0.7)",
        minHeight: "110px",
      }}
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2.5 rounded-2xl ${iconBg} shadow-xs`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-xl font-black text-slate-900 tracking-tight leading-tight">{value}</div>
        {sub && <div className="text-[11px] text-slate-500 font-bold mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

function MandiCard({ mandi, isBest }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="p-4 rounded-3xl relative overflow-hidden"
      style={{
        background: isBest
          ? "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.04))"
          : "var(--clay-surface)",
        boxShadow: isBest ? "var(--clay-card-shadow)" : "var(--clay-card-shadow-sm)",
        border: isBest ? "1.5px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.7)",
      }}
    >
      {isBest && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: "linear-gradient(90deg,#059669,#10b981)", color: "#fff" }}
        >
          ⭐ BEST PRICE
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <Store className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <div className="text-sm font-black text-slate-900">{mandi.name}</div>
          <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {mandi.distance_km} km
            <span className="text-slate-300 mx-0.5">·</span>
            <Clock className="w-2.5 h-2.5" /> {mandi.travel_time}
          </div>
        </div>
      </div>
      <div
        className="p-3 rounded-2xl mb-2"
        style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
      >
        <div className="text-[10px] text-slate-500 font-black uppercase">Price / Quintal</div>
        <div className="text-2xl font-black text-emerald-800 font-mono">₹{mandi.price_per_qtl?.toLocaleString()}</div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-500 uppercase">Demand</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            mandi.demand === "High"
              ? "bg-emerald-100 text-emerald-700"
              : mandi.demand === "Medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {mandi.demand}
        </span>
      </div>
    </motion.div>
  );
}

function ForecastDayCard({ pt }) {
  return (
    <div
      className="p-3 rounded-2xl text-center relative"
      style={{
        background: pt.is_optimal_peak
          ? "linear-gradient(135deg, rgba(5,150,105,0.12), rgba(16,185,129,0.06))"
          : "rgba(255,255,255,0.7)",
        border: pt.is_optimal_peak ? "1.5px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.6)",
        boxShadow: pt.is_optimal_peak ? "var(--clay-card-shadow-sm)" : "var(--clay-inset-sm)",
      }}
    >
      {pt.is_optimal_peak && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap"
          style={{ background: "linear-gradient(90deg,#059669,#10b981)", color: "#fff" }}
        >
          PEAK ★
        </div>
      )}
      <div className="text-[10px] font-black text-slate-600 mb-1">
        {pt.day_offset === 0 ? "Today" : `Day ${pt.day_offset}`}
      </div>
      <div className="text-[9px] text-slate-400 font-bold mb-1">{pt.date_label}</div>
      <div className="text-base font-black text-slate-900 font-mono">₹{(pt.mandi_price_per_qtl || 0).toLocaleString()}</div>
      <div className="text-[10px] font-black text-emerald-600 mt-0.5">+{pt.price_gain_pct}%</div>
      {pt.net_extra_profit > 0 && (
        <div className="text-[9px] font-black text-emerald-700 mt-1 px-1 py-0.5 rounded-lg bg-emerald-50">
          +₹{pt.net_extra_profit.toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default function AIAdvisor({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t } = useTranslation();

  const [farms, setFarms] = useState([]);
  const [farmId, setFarmId] = useState("");
  const [crop, setCrop] = useState("Soybean");
  const [quantity, setQuantity] = useState(50);
  const [storageCostPerDay, setStorageCostPerDay] = useState(2.0);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (user?.id) {
      api.listFarms(user.id)
        .then((f) => {
          const farmList = Array.isArray(f) ? f : [];
          setFarms(farmList);
          if (farmList.length > 0) {
            setFarmId(farmList[0].id);
            setCrop(farmList[0].crop || "Soybean");
          }
          setInitialLoad(false);
        })
        .catch(() => {
          setFarms([]);
          setInitialLoad(false);
        });
    } else {
      setInitialLoad(false);
    }
  }, [user]);

  const fetchAdvice = () => {
    setLoading(true);
    setError("");
    api.getMarketAdvice(crop, { quantity, farmId, storageCostPerDay })
      .then(setAdvice)
      .catch((err) => setError(err.message || "Failed to fetch market advice."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!initialLoad && !advice) {
      fetchAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoad]);

  const statCards = advice
    ? [
        {
          label: t("advisor.current_price", "Current Price"),
          value: `₹${(advice.today_price || 0).toLocaleString()}`,
          sub: `${advice.best_mandi?.name || "Best Mandi"} · /Quintal`,
          icon: DollarSign,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-700",
        },
        {
          label: t("advisor.optimal_sell_date", "Optimal Sell Date"),
          value: advice.optimal_sell_date_formatted || "–",
          sub: `Peak Surge +${advice.price_surge_pct}%`,
          icon: Calendar,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-700",
        },
        {
          label: t("advisor.storage_cost_deduction", "Storage Expense"),
          value: `-₹${(advice.total_storage_cost || 0).toLocaleString()}`,
          sub: `@ ₹${advice.storage_cost_per_day}/Qtl/day`,
          icon: Warehouse,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
        },
        {
          label: t("advisor.net_extra_profit", "Net Extra Profit"),
          value: `+₹${(advice.expected_extra_profit || 0).toLocaleString()}`,
          sub: "Net gain if held to peak",
          icon: TrendingUp,
          iconBg: "bg-violet-100",
          iconColor: "text-violet-600",
        },
      ]
    : [];

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("advisor.title", "AI Seller & Mandi Market Advisor")}
      subtitle={t("advisor.subtitle", "Compare mandis, predict optimal selling windows, simulate storage holding costs, and maximize crop returns.")}
    >
      <div className="space-y-6">

        {/* ── Controls Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200/60">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">🧮 Market Intelligence Engine</h3>
              <p className="text-[10px] text-slate-500 font-bold">Configure your crop & storage parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Crop selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {t("advisor.crop", "Crop")}
              </label>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
              >
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-bold text-slate-900 bg-transparent border-none outline-none appearance-none cursor-pointer"
                >
                  {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {t("advisor.quantity_label", "Stored Quantity (Qtl)")}
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm font-bold text-slate-900 rounded-2xl border-none outline-none"
                style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
              />
            </div>

            {/* Storage cost */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {t("advisor.storage_cost_label", "Storage Cost (₹/Qtl/day)")}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={storageCostPerDay}
                onChange={(e) => setStorageCostPerDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm font-bold text-slate-900 rounded-2xl border-none outline-none"
                style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
              />
            </div>

            {/* Farm selector */}
            {farms.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {t("advisor.farm_label", "Farm")}
                </label>
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
                >
                  <select
                    value={farmId}
                    onChange={(e) => setFarmId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-bold text-slate-900 bg-transparent border-none outline-none appearance-none cursor-pointer"
                  >
                    {farms.map((f) => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={fetchAdvice}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? t("advisor.calculating", "Calculating...") : t("advisor.get_advice", "Get AI Advice")}
                </motion.button>
              </div>
            )}
          </div>

          {farms.length > 0 && (
            <div className="flex justify-end mt-5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchAdvice}
                disabled={loading}
                className="py-2.5 px-6 rounded-2xl text-sm font-black text-white flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? t("advisor.calculating", "Calculating...") : t("advisor.get_advice", "Get AI Advice")}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl text-sm font-bold text-red-700" style={{ background: "rgba(254,226,226,0.8)", border: "1px solid rgba(252,165,165,0.5)" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !advice && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl animate-pulse" style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)" }} />
            ))}
          </div>
        )}

        <AnimatePresence>
          {advice && (
            <>
              {/* ── KPI Metro Cards ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {statCards.map((c) => <MetroCard key={c.label} {...c} />)}
              </motion.div>

              {/* ── Decision Banner ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-5 rounded-3xl"
                style={{
                  background: advice.decision === "HOLD"
                    ? "linear-gradient(135deg, rgba(5,150,105,0.1), rgba(16,185,129,0.05))"
                    : "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(239,68,68,0.04))",
                  boxShadow: "var(--clay-card-shadow)",
                  border: advice.decision === "HOLD"
                    ? "1.5px solid rgba(16,185,129,0.35)"
                    : "1.5px solid rgba(239,68,68,0.35)",
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      INSTITUTIONAL MARKET TIMING
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      📈 {t("advisor.holding_title", "\"Sell vs. Store\" AI Market Holding Advisor")}
                    </h3>
                  </div>
                  <span
                    className="px-4 py-1.5 rounded-full text-sm font-black"
                    style={{
                      background: advice.decision === "HOLD"
                        ? "linear-gradient(90deg,#059669,#10b981)"
                        : "linear-gradient(90deg,#dc2626,#ef4444)",
                      color: "#fff",
                      boxShadow: advice.decision === "HOLD"
                        ? "0 4px 12px rgba(5,150,105,0.3)"
                        : "0 4px 12px rgba(220,38,38,0.3)",
                    }}
                  >
                    {advice.decision === "HOLD" ? `🟢 HOLD ${advice.wait_days} DAYS` : "🔴 SELL IMMEDIATELY"}
                  </span>
                </div>

                {/* Quote box */}
                <div
                  className="p-4 rounded-2xl mb-4 text-sm font-semibold text-slate-700 leading-relaxed"
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    borderLeft: `4px solid ${advice.decision === "HOLD" ? "#059669" : "#dc2626"}`,
                    boxShadow: "var(--clay-inset-sm)",
                  }}
                >
                  "{advice.holding_summary}"
                </div>

                {/* Live Agmarknet Banner */}
                {advice.live_agmarknet && (
                  <div
                    className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl mb-4 text-xs"
                    style={{
                      background: "rgba(236,253,245,0.8)",
                      border: "1px solid rgba(110,231,183,0.4)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-white" style={{ background: "#16a34a" }}>
                        LIVE AGMARKNET
                      </span>
                      <span className="font-bold text-slate-800">
                        {advice.live_agmarknet.mandi} · {advice.live_agmarknet.commodity}
                      </span>
                    </div>
                    <div className="flex gap-4 font-bold">
                      <span className="text-slate-600">Arrivals: <strong className="text-slate-900">{advice.live_agmarknet.arrival_tonnes} MT</strong></span>
                      <span className="text-emerald-700">Modal: <strong>₹{advice.live_agmarknet.modal_price}/Qtl</strong></span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ── AI Smart Market Route: Map + Mandi Cards ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-3xl space-y-5"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow)",
                  border: "1px solid rgba(255,255,255,0.7)",
                }}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
                  <div className="w-8 h-8 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{t("advisor.smart_route", "AI Smart Market Route")}</h3>
                    <p className="text-[10px] text-slate-500 font-bold">{t("advisor.smart_route_sub", "Compare nearest mandis by live price, demand & transport time")}</p>
                  </div>
                </div>

                {advice.mandis && advice.mandis.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.6)" }}>
                    <MandiMap mandis={advice.mandis} />
                  </div>
                )}

                {advice.mandis && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {advice.mandis.map((m) => (
                      <MandiCard key={m.name} mandi={m} isBest={m.name === advice.best_mandi?.name} />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* ── 30-Day Price Forecast Timeline ── */}
              {advice.price_forecast_timeline && advice.price_forecast_timeline.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-5 rounded-3xl space-y-4"
                  style={{
                    background: "var(--clay-surface)",
                    boxShadow: "var(--clay-card-shadow)",
                    border: "1px solid rgba(255,255,255,0.7)",
                  }}
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
                    <div className="w-8 h-8 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-violet-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {t("advisor.timeline_title", "30-Day Market Price & Net Return Forecast Curve")}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold">Hover each day to compare net profit after storage cost</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
                    {advice.price_forecast_timeline.map((pt) => (
                      <ForecastDayCard key={pt.day_offset} pt={pt} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── AI Recommendation Summary ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-3xl space-y-4"
                style={{
                  background: "linear-gradient(135deg, rgba(5,150,105,0.07), rgba(16,185,129,0.03))",
                  boxShadow: "var(--clay-card-shadow)",
                  border: "1.5px solid rgba(16,185,129,0.25)",
                }}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-200/50">
                  <div className="w-8 h-8 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t("advisor.recommendation", "📊 AI Recommendation Summary")}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: t("advisor.current_price", "Current Market Price"), val: `₹${advice.today_price} / Quintal`, icon: "💰" },
                    { label: "Optimal Target Mandi", val: `${advice.best_mandi?.name} (₹${advice.predicted_price}/Qtl)`, icon: "🏪" },
                    { label: "Optimal Sell Date", val: advice.optimal_sell_date_formatted, icon: "📅" },
                    { label: "Net Extra Profit", val: `₹${(advice.expected_extra_profit || 0).toLocaleString()}`, icon: "📈" },
                  ].map(({ label, val, icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 p-3 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
                    >
                      <span className="text-xl shrink-0">{icon}</span>
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{label}</div>
                        <div className="text-sm font-black text-slate-900">{val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
                >
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t("advisor.final_decision", "Final AI Decision")}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">{advice.final_decision}</p>
                </div>

                {advice.methodology && (
                  <p className="text-[10px] text-slate-400 font-semibold">{advice.methodology}</p>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
