import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { api } from "../services/api.js";
import NdviMap from "../components/NdviMap.jsx";
import AppShell from "../components/AppShell.jsx";

export default function FarmDetail({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [farm, setFarm] = useState(null);
  const [allFarms, setAllFarms] = useState([]);
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState("");
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      api.listFarms(user.id).then((list) => setAllFarms(list || [])).catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    api
      .getFarm(farmId)
      .then((f) => {
        setFarm(f);
        setLoadingGrid(true);
        api
          .getNdviGrid(farmId, 3)
          .then((result) => setGrid(result.cells))
          .catch(() => {})
          .finally(() => setLoadingGrid(false));
      })
      .catch((err) => setError(err.message || "Farm not found"));
  }, [farmId]);

  const handleDeleteFarm = async () => {
    if (!farm) return;
    setDeleting(true);
    try {
      await api.deleteFarm(farm.id);
    } catch (err) {
      console.warn("Delete request non-fatal notification:", err);
    }
    const remaining = allFarms.filter((f) => f.id !== farm.id);
    setAllFarms(remaining);
    setShowConfirmModal(false);
    setDeleting(false);
    if (remaining.length > 0) {
      navigate(`/farms/${remaining[0].id}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (!farm) {
    return (
      <AppShell
        user={user}
        role={role}
        onSwitchRole={onSwitchRole}
        onLogout={onLogout}
        onLanguageChange={onLanguageChange}
        title="Farm Digital Twin"
        subtitle="Field Management"
      >
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
          {error ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Plot Removed or Not Found</h3>
              <p className="text-xs text-slate-500">
                This farm boundary is no longer in your active fields database.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors"
                >
                  Return to Dashboard
                </Link>
                {allFarms.length > 0 && (
                  <button
                    onClick={() => navigate(`/farms/${allFarms[0].id}`)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Open {allFarms[0].farm_name}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 font-semibold">{t("common.loading")}</p>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={farm.farm_name}
      subtitle={`${farm.crop} \u00b7 ${farm.area_acres ? farm.area_acres.toFixed(2) : "?"} ${t("common.area_acres").replace("Area (", "").replace(")", "")}`}
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setShowConfirmModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Delete this farm"
          >
            <Trash2 style={{ width: "14px", height: "14px" }} />
            <span>Delete Farm</span>
          </button>
          <Link to="/dashboard" style={{ fontSize: "0.85rem", color: "var(--canopy)", textDecoration: "none", fontWeight: 600 }}>
            {t("farm_detail.back")}
          </Link>
        </div>
      }
    >
      {error && <p style={{ color: "var(--stress)" }}>{error}</p>}

      <div style={{ maxWidth: 960 }} className="space-y-6">
        {/* Multi-Farm Boundary Selector */}
        {allFarms.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e7e3d8",
              padding: "1rem 1.4rem",
              marginBottom: "1.2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem" }}>🌾</span>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1c2419" }}>{t("dashboard.select_farm")}</div>
                <div style={{ fontSize: "0.76rem", color: "#6e6757" }}>{t("dashboard.registered_fields", { count: allFarms.length })}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {allFarms.map((f) => {
                const isActive = f.id === farm.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => navigate(`/farms/${f.id}`)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "16px",
                      border: isActive ? "2px solid #2f4d27" : "1px solid #dcd3bf",
                      background: isActive ? "#2f4d27" : "#fcfaf4",
                      color: isActive ? "#ffffff" : "#3b3628",
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.farm_name} ({f.crop})
                  </button>
                );
              })}

              <Link
                to="/farms/new"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  border: "1px dashed #2f4d27",
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <Plus style={{ width: "13px", height: "13px" }} />
                <span>+ Register Field</span>
              </Link>
            </div>
          </div>
        )}

        {/* Farm Metadata Card */}
        <div className="card" style={{ background: "#ffffff", borderRadius: "18px", padding: "1.4rem", border: "1px solid #e7e3d8" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#6e6757", fontWeight: 500 }}>{t("dashboard.farm_name").replace(" *", "").toUpperCase()}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c2419", marginTop: "2px" }}>{farm.farm_name}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#6e6757", fontWeight: 500 }}>{t("common.crop").toUpperCase()}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c2419", marginTop: "2px" }}>{farm.crop}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#6e6757", fontWeight: 500 }}>{t("dashboard.sowing_date").toUpperCase()}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c2419", marginTop: "2px" }}>{farm.sowing_date || "N/A"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#6e6757", fontWeight: 500 }}>{t("dashboard.area").toUpperCase()}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c2419", marginTop: "2px" }}>{farm.area_acres ? `${farm.area_acres.toFixed(2)}` : "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Farm Boundary / Field Health Map Card */}
        <div className="card" style={{ background: "#ffffff", borderRadius: "18px", padding: "1.4rem", border: "1px solid #e7e3d8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1c2419", margin: 0 }}>{t("farm_detail.map_title")}</h3>
            {loadingGrid && <span style={{ fontSize: "0.8rem", color: "#6e6757" }}>{t("farm_detail.loading_zones")}</span>}
          </div>
          
          <NdviMap boundaryGeojson={farm.boundary} gridCells={grid} allBoundaries={allFarms} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", fontSize: "0.8rem", color: "#6b6455" }}>
            <span>{t("farm_detail.boundary_captured")}</span>
            {grid && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <span><span style={{ color: "#4d7042" }}>&#9632;</span> {t("farm_detail.good_vigor")}</span>
                <span><span style={{ color: "#d9a441" }}>&#9632;</span> {t("farm_detail.moderate")}</span>
                <span><span style={{ color: "#b4472a" }}>&#9632;</span> {t("farm_detail.low_vigor")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "2rem",
              maxWidth: "460px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: "1px solid #fee2e2",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  backgroundColor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle style={{ width: "22px", height: "22px", color: "#dc2626" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#1f2937" }}>
                  Delete Farm?
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#6b7280" }}>
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#f9fafb",
                borderRadius: "14px",
                padding: "1rem",
                fontSize: "0.88rem",
                color: "#374151",
                marginBottom: "1.5rem",
                border: "1px solid #f3f4f6",
              }}
            >
              Are you sure you want to delete <strong>{farm.farm_name}</strong> ({farm.crop},{" "}
              {farm.area_acres ? `${farm.area_acres.toFixed(2)} acres` : "N/A"})?
              <br />
              <span style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "4px", display: "block" }}>
                All satellite NDVI observations, weather logs, and field predictions for this plot will be removed.
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={deleting}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFarm}
                disabled={deleting}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: deleting ? "#f87171" : "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Trash2 style={{ width: "16px", height: "16px" }} />
                <span>{deleting ? "Deleting..." : "Yes, Delete Farm"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
