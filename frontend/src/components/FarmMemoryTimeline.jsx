import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Brain, History, PlusCircle, Droplet, Sprout, ShieldAlert, CheckCircle2 } from "lucide-react";

export function FarmMemoryTimeline({ farmId }) {
  const { t } = useTranslation();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actType, setActType] = useState("irrigation");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("Liters");
  const [submitting, setSubmitting] = useState(false);

  const fetchMemory = () => {
    if (!farmId) return;
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";
    fetch(`${apiBase}/api/farms/${farmId}/memory`)
      .then((res) => res.json())
      .then((data) => {
        setMemory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load memory:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMemory();
  }, [farmId]);

  const handleLogActivity = (e) => {
    e.preventDefault();
    if (!desc) return;
    setSubmitting(true);

    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";
    fetch(`${apiBase}/api/farms/${farmId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_type: actType,
        description: desc,
        amount: amount ? parseFloat(amount) : null,
        unit: unit
      })
    })
      .then((res) => res.json())
      .then(() => {
        setSubmitting(false);
        setDesc("");
        setAmount("");
        setShowForm(false);
        fetchMemory();
      })
      .catch((err) => {
        console.error("Failed to log activity:", err);
        setSubmitting(false);
      });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-20 bg-slate-100 rounded-xl mb-3"></div>
      </div>
    );
  }

  if (!memory) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{t("farm_memory.title", "AI Farm Memory")}</h3>
            <p className="text-xs text-slate-500">{t("farm_memory.subtitle", "Historical activities, past diseases, & farmer preferences")}</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
        >
          <PlusCircle className="w-4 h-4" /> {t("farm_memory.log_activity", "Log Activity")}
        </button>
      </div>

      {/* Form for logging new activity */}
      {showForm && (
        <form onSubmit={handleLogActivity} className="mb-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
          <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">{t("farm_memory.record_title", "Record Activity to AI Memory")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("farm_memory.type", "Type")}</label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="irrigation">{t("farm_memory.irrigation", "Irrigation")}</option>
                <option value="fertilizer">{t("farm_memory.fertilizer", "Fertilizer")}</option>
                <option value="pesticide">{t("farm_memory.spraying", "Pesticide Spray")}</option>
                <option value="harvesting">{t("farm_memory.harvesting", "Harvesting")}</option>
                <option value="soil_treatment">{t("farm_memory.fertilizer", "Soil Treatment")}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("farm_memory.amount", "Amount (Optional)")}</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("farm_memory.unit", "Unit")}</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="Liters">Liters</option>
                <option value="Kg">Kg</option>
                <option value="Hours">Hours</option>
                <option value="Quintals">Quintals</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t("farm_memory.desc", "Description / Notes")}</label>
            <input
              type="text"
              placeholder="e.g. Drip irrigated field for 2 hours, applied NPK 19:19:19"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              {t("farm_memory.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow-xs"
            >
              {submitting ? t("farm_memory.saving", "Saving...") : t("farm_memory.save", "Save to Memory")}
            </button>
          </div>
        </form>
      )}

      {/* Memory Timeline List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" /> {t("farm_memory.recent_timeline", "Recent Memory Timeline:")}
        </h4>

        {memory.activities?.length === 0 && memory.disease_history?.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
            No activities logged yet. Click "Log Activity" to start building AI Farm Memory!
          </p>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-3 pl-4 space-y-4">
            {memory.activities?.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-[23px] top-1 p-1 bg-purple-100 text-purple-700 rounded-full border border-white shadow-2xs">
                  {act.activity_type === "irrigation" ? (
                    <Droplet className="w-3 h-3" />
                  ) : (
                    <Sprout className="w-3 h-3" />
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 capitalize">{act.activity_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.activity_date}</span>
                  </div>
                  <p className="text-xs text-slate-600">{act.description}</p>
                  {act.amount && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      {act.amount} {act.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {memory.disease_history?.map((dh, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[23px] top-1 p-1 bg-amber-100 text-amber-700 rounded-full border border-white shadow-2xs">
                  <ShieldAlert className="w-3 h-3" />
                </div>
                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-900">{dh.disease_name || "Disease Scan"}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dh.date}</span>
                  </div>
                  <p className="text-xs text-amber-800">{dh.recommendation || "Scan recorded"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
