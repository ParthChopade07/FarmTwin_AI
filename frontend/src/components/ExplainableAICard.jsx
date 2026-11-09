import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, AlertTriangle, CheckCircle, Cpu, Layers } from "lucide-react";

export function ExplainableAICard({ farmId }) {
  const { t } = useTranslation();
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";
    fetch(`${apiBase}/api/farms/${farmId}/xai`)
      .then((res) => res.json())
      .then((data) => {
        setXaiData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load XAI data:", err);
        setLoading(false);
      });
  }, [farmId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-20 bg-slate-100 rounded-xl mb-3"></div>
      </div>
    );
  }

  if (!xaiData) return null;

  const isHigh = xaiData.overall_risk_score >= 60;
  const isMod = xaiData.overall_risk_score >= 35 && xaiData.overall_risk_score < 60;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{t("xai.title", "Explainable AI (XAI) Factor Analysis")}</h3>
            <p className="text-xs text-slate-500">{t("xai.subtitle", "Transparent factor attribution breakdown")}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${
            isHigh
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : isMod
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          {xaiData.overall_risk_score}% {xaiData.overall_status === "Low Stress / Healthy" ? t("xai.healthy", "Low Stress / Healthy") : xaiData.overall_status}
        </span>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl mb-5 border border-slate-200/60">
        <p className="text-sm text-slate-700 font-medium leading-relaxed">{xaiData.xai_summary}</p>
      </div>

      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5" /> {t("xai.factors", "Major Contributing Factors:")}
      </h4>

      <div className="space-y-3">
        {xaiData.contributing_factors?.map((factor, idx) => (
          <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {factor.status.includes("High") || factor.status.includes("Decline") ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="text-sm font-semibold text-slate-800">{factor.factor_name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {factor.category}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-600">{t("xai.impact", "+{{count}}% impact", { count: factor.impact_weight })}</span>
            </div>

            {/* Impact Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${
                  factor.impact_weight > 25 ? "bg-rose-500" : factor.impact_weight > 10 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, factor.impact_weight * 2.5)}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-600 leading-normal">{factor.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
