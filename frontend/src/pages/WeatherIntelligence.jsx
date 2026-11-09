import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import { useTranslation } from "react-i18next";
import {
  Thermometer, Droplets, Wind, Sun, CloudRain, ShieldAlert,
  Eye, Gauge, Leaf, Sunrise, Sunset, Sparkles, MapPin,
} from "lucide-react";

function formatTime(iso) {
  if (!iso) return "–";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

const CONDITION_ICON = (c = "") => {
  c = c.toLowerCase();
  if (c.includes("rain") || c.includes("shower")) return "🌧️";
  if (c.includes("cloud")) return "⛅";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  return "🌤️";
};

function MetroCard({ label, value, sub, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
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
      {loading ? (
        <div className="h-8 w-24 bg-slate-200/60 animate-pulse rounded-lg mt-3" />
      ) : (
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{value}</div>
          {sub && <div className="text-[11px] text-slate-500 font-bold mt-0.5">{sub}</div>}
        </div>
      )}
    </motion.div>
  );
}

function ForecastRow({ day, todayStr }) {
  const isToday = day.date === todayStr;
  const label = isToday ? "Today" : new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" });
  const icon = CONDITION_ICON(day.condition);
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${isToday ? "font-black" : "font-bold"}`}
      style={{
        background: isToday ? "rgba(5,150,105,0.08)" : "rgba(255,255,255,0.6)",
        border: isToday ? "1px solid rgba(110,231,183,0.4)" : "1px solid transparent",
        boxShadow: isToday ? "var(--clay-card-shadow-sm)" : "none",
      }}
    >
      <span className="w-12 text-xs text-slate-700 shrink-0">{label}</span>
      <span className="text-base shrink-0">{icon}</span>
      <span className="flex-1 text-xs text-slate-500 font-semibold truncate">{day.condition}</span>
      <div className="text-right shrink-0">
        <span className="text-sm font-black text-slate-800">{Math.round(day.temp_max_c)}°</span>
        <span className="text-xs text-slate-400 font-bold ml-1">{Math.round(day.temp_min_c)}°</span>
      </div>
      {day.rain_chance_pct != null && (
        <span className="text-[10px] font-black text-blue-600 w-8 text-right shrink-0">{day.rain_chance_pct}%💧</span>
      )}
    </div>
  );
}

function SoilProfilePanel({ farmId }) {
  const { t } = useTranslation();
  const [soil, setSoil] = useState(null);
  useEffect(() => {
    if (!farmId) return;
    api.getSoilProfile(farmId).then(setSoil).catch(() => {});
  }, [farmId]);
  if (!soil) return null;

  const fields = [
    { label: t("dashboard.soil_type", "Soil Type"), val: soil.soil_type, emoji: "🪨" },
    { label: t("dashboard.soil_ph", "Soil pH"), val: soil.ph, emoji: "⚗️" },
    { label: t("dashboard.clay", "Clay"), val: `${soil.clay_pct}%`, emoji: "🏺" },
    { label: t("dashboard.sand", "Sand"), val: `${soil.sand_pct}%`, emoji: "🏖️" },
    { label: t("dashboard.org_carbon", "Organic Carbon"), val: `${soil.organic_carbon_g_kg} g/kg`, emoji: "🌿" },
  ];

  return (
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #92400e, #d97706)" }}
          >
            <span className="text-lg">🧪</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Soil Profile & Taxonomy</h3>
            <p className="text-[10px] text-amber-700 font-bold">{soil.source}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
          SoilGrids v2 · ISRIC
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {fields.map(({ label, val, emoji }) => (
          <div
            key={label}
            className="p-3 rounded-2xl text-center"
            style={{
              background: "rgba(254,243,199,0.6)",
              border: "1px solid rgba(253,230,138,0.5)",
              boxShadow: "var(--clay-inset-sm)",
            }}
          >
            <div className="text-xl mb-1">{emoji}</div>
            <div className="text-[10px] text-amber-700 font-black uppercase tracking-wider">{label}</div>
            <div className="text-sm font-black text-amber-900 mt-0.5">{val}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function WeatherIntelligence({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [farmId, setFarmId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.id) {
      api.listFarms(user.id).then((f) => {
        const list = Array.isArray(f) ? f : [];
        setFarms(list);
        if (list.length) setFarmId(list[0].id);
        else setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    setError("");
    api.getWeather(farmId)
      .then(setData)
      .catch((e) => setError(e.message || "Failed to fetch weather data."))
      .finally(() => setLoading(false));
  }, [farmId]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const farm = farms.find((f) => f.id === farmId);

  const statCards = data ? [
    { label: t("weather.temperature", "Temperature"), value: `${data.current.temperature_c ?? "–"}°C`, sub: `Feels like ${data.current.feels_like_c ?? "–"}°C`, icon: Thermometer, iconBg: "bg-red-100", iconColor: "text-red-600" },
    { label: t("weather.humidity", "Humidity"), value: `${data.current.humidity_pct ?? "–"}%`, sub: "Relative Humidity", icon: Droplets, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { label: t("weather.wind", "Wind Speed"), value: `${data.current.wind_kmh ?? "–"} km/h`, sub: data.current.wind_direction || "Surface wind", icon: Wind, iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    { label: t("weather.condition", "Condition"), value: data.current.condition || "–", sub: farm?.location || "Farm location", icon: Sun, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  ] : [];

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("weather.title", "Weather Intelligence")}
      subtitle={t("weather.subtitle", "Hyperlocal 7-day forecast, AQI, soil moisture & field-specific AI farming advisories.")}
    >
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Farm Selector */}
        {farms.length > 1 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)", border: "1px solid rgba(255,255,255,0.7)" }}
          >
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-black text-slate-600">Active Farm:</span>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              className="flex-1 bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>🌾 {f.farm_name} — {f.crop}</option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">⚠️ {error}</div>
        )}

        {/* No farms */}
        {farms.length === 0 && !loading && (
          <div className="p-12 rounded-3xl text-center" style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow)" }}>
            <div className="text-4xl mb-3">🌾</div>
            <p className="text-sm font-bold text-slate-600">{t("weather.register_prompt", "Register a farm to view hyperlocal weather data.")}</p>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-3xl animate-pulse" style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)" }} />
              ))
            : statCards.map((c) => <MetroCard key={c.label} loading={loading} {...c} />)
          }
        </div>

        {data && (
          <>
            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* 7-Day Forecast — tall left panel */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-5 p-5 rounded-3xl space-y-3"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow)",
                  border: "1px solid rgba(255,255,255,0.7)",
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                      <CloudRain className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">📅 {t("weather.forecast", "7-Day Forecast")}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">7 Days</span>
                </div>
                <div className="space-y-1.5">
                  {data.forecast_7d.map((day) => (
                    <ForecastRow key={day.date} day={day} todayStr={todayStr} />
                  ))}
                </div>
              </motion.div>

              {/* Right 2×2 grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Today Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="p-5 rounded-3xl space-y-3"
                  style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)", border: "1px solid rgba(255,255,255,0.7)" }}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">☀️ {t("weather.today", "Today's Metrics")}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t("weather.sunrise", "Sunrise"), val: formatTime(data.today.sunrise), icon: "🌅" },
                      { label: t("weather.sunset", "Sunset"), val: formatTime(data.today.sunset), icon: "🌇" },
                      { label: t("weather.rain_chance", "Rain Chance"), val: `${data.today.rain_chance_pct ?? "–"}%`, icon: "💧" },
                      { label: t("weather.pressure", "Pressure"), val: `${data.current.pressure_hpa ?? "–"} hPa`, icon: "🌡️" },
                    ].map(({ label, val, icon }) => (
                      <div
                        key={label}
                        className="p-2.5 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
                      >
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">{icon} {label}</div>
                        <div className="text-sm font-black text-slate-900 mt-0.5">{val}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Air Quality */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-5 rounded-3xl space-y-3"
                  style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)", border: "1px solid rgba(255,255,255,0.7)" }}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">🍃 {t("weather.air_quality", "Air Quality")}</h3>
                  </div>
                  {data.air_quality ? (
                    <>
                      <div
                        className="p-3 rounded-2xl flex items-center justify-between"
                        style={{ background: "linear-gradient(135deg, rgba(236,253,245,0.9), rgba(209,250,229,0.7))", border: "1px solid rgba(110,231,183,0.4)" }}
                      >
                        <div>
                          <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">AQI Index</div>
                          <div className="text-2xl font-black text-slate-900 font-mono">{data.air_quality.aqi ?? "–"}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-white text-emerald-800 border border-emerald-200">
                          {data.air_quality.aqi_label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}>
                          <div className="text-[10px] font-black text-slate-500 uppercase">PM2.5</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">{data.air_quality.pm2_5 ?? "–"} µg/m³</div>
                        </div>
                        <div className="p-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}>
                          <div className="text-[10px] font-black text-slate-500 uppercase">UV Index</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">{data.today.uv_index_max ?? "–"}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 font-semibold">{t("weather.aqi_unavailable", "Air quality data unavailable for this location.")}</p>
                  )}
                </motion.div>

                {/* Weather Alerts */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-5 rounded-3xl space-y-3"
                  style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)", border: "1px solid rgba(255,255,255,0.7)" }}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">🚨 {t("weather.alerts", "Active Alerts")}</h3>
                  </div>
                  {data.alerts.length === 0 ? (
                    <div
                      className="p-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700"
                      style={{ background: "rgba(236,253,245,0.8)", border: "1px solid rgba(110,231,183,0.3)" }}
                    >
                      ✅ {t("weather.no_alerts", "No active weather alerts. All clear.")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.alerts.map((a, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl"
                          style={{ background: a.level === "warning" ? "rgba(254,243,199,0.8)" : "rgba(219,234,254,0.8)", border: `1px solid ${a.level === "warning" ? "rgba(253,230,138,0.6)" : "rgba(147,197,253,0.5)"}` }}
                        >
                          <div className="text-xs font-black text-slate-800">{a.title}</div>
                          <div className="text-[11px] text-slate-600 font-medium mt-0.5">{a.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* AI Farming Advice */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-5 rounded-3xl space-y-3"
                  style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)", border: "1px solid rgba(255,255,255,0.7)" }}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">💡 {t("weather.advice", "AI Field Advisory")}</h3>
                  </div>
                  <div className="space-y-2">
                    {data.advice.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-2xl text-xs font-semibold text-slate-700 leading-snug"
                        style={{ background: "rgba(255,255,255,0.7)", boxShadow: "var(--clay-inset-sm)" }}
                      >
                        <span className="text-base shrink-0 mt-0.5">🌱</span>
                        <span>{a.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Soil Profile */}
            <SoilProfilePanel farmId={farmId} />
          </>
        )}
      </div>
    </AppShell>
  );
}
