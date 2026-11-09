import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Calendar, CloudRain, ShieldAlert, CheckSquare, RefreshCw } from "lucide-react";

export function WeeklyReportCard({ farmId }) {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReport = () => {
    if (!farmId) return;
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";
    fetch(`${apiBase}/api/farms/${farmId}/weekly-report`)
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load weekly report:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [farmId]);

  const handleGenerateFresh = () => {
    setGenerating(true);
    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";
    fetch(`${apiBase}/api/farms/${farmId}/weekly-report/generate`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setGenerating(false);
      })
      .catch((err) => {
        console.error("Failed to generate report:", err);
        setGenerating(false);
      });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="h-24 bg-slate-100 rounded-xl mb-3"></div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-6 border border-emerald-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{t("weekly_report.title", "Weekly Farm Report")}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {t("weekly_report.week_briefing", "Week Briefing: {{week}}", { week: report.report_week })}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateFresh}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
          {generating ? t("weekly_report.refreshing", "Generating...") : t("weekly_report.refresh", "Refresh Report")}
        </button>
      </div>

      {/* Executive Summary */}
      <div className="mb-4 p-4 bg-white rounded-xl border border-emerald-100 shadow-2xs">
        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5">{t("weekly_report.exec_summary", "Executive Summary")}</h4>
        <p className="text-sm text-slate-700 leading-relaxed">{report.summary_text}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Outlook */}
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <CloudRain className="w-4 h-4 text-sky-500" /> {t("weekly_report.weather_outlook", "Weather Outlook")}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">{report.weather_outlook}</p>
        </div>

        {/* Risks Identified */}
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> {t("weekly_report.risk_drivers", "Key Risk Drivers")}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{report.risks_identified}</p>
        </div>

        {/* Recommended Actions */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60 shadow-2xs">
          <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" /> {t("weekly_report.recommended_actions", "Recommended Actions")}
          </h4>
          <p className="text-xs text-emerald-950 font-medium leading-relaxed whitespace-pre-line">
            {report.recommended_actions}
          </p>
        </div>
      </div>
    </div>
  );
}
