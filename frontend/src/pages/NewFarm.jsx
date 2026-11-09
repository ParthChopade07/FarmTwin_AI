import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BoundaryMap from "../components/BoundaryMap.jsx";
import AppShell from "../components/AppShell.jsx";
import { api } from "../services/api.js";
import { CROPS } from "../utils/constants.js";
import { PlusCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function NewFarm({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t } = useTranslation();
  const [farmName, setFarmName] = useState("");
  const [crop, setCrop] = useState("Soybean");
  const [sowingDate, setSowingDate] = useState("");
  const [boundary, setBoundary] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [registeredList, setRegisteredList] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleBoundaryChange = useCallback((geojson) => setBoundary(geojson), []);

  const saveFarm = async () => {
    if (!boundary) {
      throw new Error(t("dashboard.farm_boundary_sub"));
    }
    if (!farmName.trim()) {
      throw new Error(t("dashboard.farm_name").replace(" *", " is required"));
    }

    const created = await api.createFarm({
      user_id: user?.id || "",
      farm_name: farmName,
      crop,
      sowing_date: sowingDate || null,
      boundary,
    });
    return created;
  };

  const handleSaveAndFinish = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await saveFarm();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || t("common.error"));
      setSaving(false);
    }
  };

  const handleSaveAndAddAnother = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await saveFarm();
      setRegisteredList((prev) => [...prev, created]);
      setSuccessMsg(`✅ ${created.farm_name} (${created.crop}) registered! You can now draw and add another farm.`);
      // Reset inputs for next farm registration
      setFarmName("");
      setSowingDate("");
      setBoundary(null);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell user={user} role={role} onSwitchRole={onSwitchRole} onLogout={onLogout} onLanguageChange={onLanguageChange} title={t("dashboard.register_farm")}>
      <div style={{ maxWidth: 760 }}>

        {/* Success Banner when registering multiple farms */}
        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Summary of Registered Farms in Current Session */}
        {registeredList.length > 0 && (
          <div className="mb-4 p-3.5 bg-white border border-slate-200 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <span>🌾</span> Farms Registered in This Session ({registeredList.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {registeredList.map((f, i) => (
                <span key={i} className="px-2.5 py-1 bg-emerald-100/70 text-emerald-900 rounded-full text-[11px] font-bold border border-emerald-200">
                  #{i + 1} {f.farm_name} ({f.crop}) • {f.area_acres ? `${f.area_acres.toFixed(2)} ac` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        <form>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="field-group">
                <label htmlFor="farmName">{t("dashboard.farm_name").replace(" *", "")}</label>
                <input
                  id="farmName"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. North Field Parcel #2"
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="crop">{t("common.crop")}</label>
                <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
                  {CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="sowingDate">{t("dashboard.sowing_date")}</label>
                <input
                  id="sowingDate"
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.75rem" }}>{t("dashboard.farm_boundary")}</label>
            <p style={{ fontSize: "0.85rem", color: "#6b6455", marginTop: 0 }}>
              {t("dashboard.farm_boundary_sub")}
            </p>
            <BoundaryMap onBoundaryChange={handleBoundaryChange} key={registeredList.length} />
            {boundary && (
              <p style={{ fontSize: "0.85rem", color: "var(--canopy)", marginTop: "0.75rem" }}>
                {t("dashboard.boundary_captured")}
              </p>
            )}
          </div>

          {error && <p style={{ color: "var(--stress)", marginBottom: "1rem" }}>{error}</p>}

          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleSaveAndFinish}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? t("common.saving") : "Save Farm & Finish"}
            </button>

            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4 text-purple-700" />
              Save & Add Another Farm
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
